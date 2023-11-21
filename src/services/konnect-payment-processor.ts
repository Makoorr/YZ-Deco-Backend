import { 
    AbstractPaymentProcessor, 
    PaymentProcessorContext, 
    PaymentProcessorError, 
    PaymentProcessorSessionResponse, 
    PaymentSessionStatus,
    isPaymentProcessorError,
} from "@medusajs/medusa";
import { EOL } from "os";

var request = require('request');

class KonnectPaymentProcessor extends AbstractPaymentProcessor {
    static identifier = "konnect";

    constructor(container, options) {
        super(container)
        require('dotenv').config();
    }

    protected async initPaymentAPI(postData) {
        var content = {
            "receiverWalletId": process.env.WALLET_ID,
            "token": postData?.currency_code.toUpperCase() || postData.token.toUpperCase() || "TND",
            "amount": postData.amount,
            "type": "immediate",
            "description": "Payment From Client:"+postData?.customer?.first_name+" "+postData?.customer?.last_name+" - Order:"+postData.resource_id+" - Amount:"+postData.amount+" "+postData?.currency_code.toUpperCase(),
            "lifespan": 60,
            "checkoutForm": false,
            "addPaymentFeesToAmount": true,
            "firstName": postData?.customer?.first_name || postData?.firstName || "john",
            "lastName": postData?.customer?.last_name || postData?.lastName || "doe",
            "phoneNumber": postData?.customer?.phone || postData?.phoneNumber || "00000000",
            "email": postData.email || "",
            "orderId": postData?.resource_id || postData.cartId,
            "webhook": process.env.BACKEND_URL+"/api/notification_payment",
            "silentWebhook": true,
            "successUrl": process.env.BACKEND_URL+"/gateway/payment-success?cart_id="+postData?.resource_id,
            "failUrl": process.env.BACKEND_URL+"/gateway/payment-failure?cart_id="+postData?.resource_id,
            "theme": "light",
        }
        
        var clientServerOptions = {
            uri: "https://api.preprod.konnect.network/api/v2/payments/init-payment",
            body: JSON.stringify(content),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.KONNECT_APIKEY
            }
        }

        // Return a Promise for the asynchronous operation
        return new Promise((resolve, reject) => {
            request(clientServerOptions, function (err, res) {
            if (err) {
                reject(err); // Reject the Promise in case of an error
            } else {
                try {
                    const data = JSON.parse(res.body);
                    resolve(data); // Resolve the Promise with res.body
                } catch (error) {
                    reject(error); // Reject the Promise if there's an error
                }
            }
            });
        });
    }

    protected buildError(message: string,e: PaymentProcessorError | Error): PaymentProcessorError {
        return {
        error: message,
        code: "code" in e ? e.code : "",
        detail: isPaymentProcessorError(e)
            ? `${e.error}${EOL}${e.detail ?? ""}`
            : "detail" in e
            ? e.detail
            : e.message ?? "",
        }
    }

    async initiatePayment(context: PaymentProcessorContext): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
        const update_requests = {
            customer_metadata: {
                "metadata": context.customer.metadata,   
            },
        }
        const res: Object = await this.initPaymentAPI(context);

        const session_data = {
            ...res,
            "token": context.currency_code,
            "amount": context.amount,
            "firstName": context.customer.first_name || context.billing_address?.first_name || context.paymentSessionData?.firstName || "",
            "lastName": context.customer.last_name || context.billing_address?.last_name || context.paymentSessionData?.lastName || "",
            "phoneNumber": context.customer.phone || context.billing_address?.phone || context.paymentSessionData?.phoneNumber || "",
            "email": context.customer.email,
        }

        return {
            session_data,
            update_requests,
        }
    }

    async updatePayment(context: PaymentProcessorContext): Promise<void | PaymentProcessorError | PaymentProcessorSessionResponse> {
        const session_data = {
            ...context.paymentSessionData,
            "amount": context.amount,
            "firstName": context.customer.first_name || context.paymentSessionData?.firstName || context.billing_address?.first_name || "",
            "lastName": context.customer.last_name || context.paymentSessionData?.lastName || context.billing_address?.last_name || "",
            "phoneNumber": context.customer.phone || context.paymentSessionData?.phoneNumber || context.billing_address?.phone || "",
            "email": context.customer.email,
        }

        const update_requests = {
            customer_metadata: context.customer.metadata,
        }

        return {
            session_data,
            update_requests,
        }
    }

    async authorizePayment(paymentSessionData: Record<string, unknown>, context: Record<string, unknown>): Promise<PaymentProcessorError | {status: PaymentSessionStatus; data: Record<string, unknown>; }>{

        return {
            status: PaymentSessionStatus.AUTHORIZED,
            data: paymentSessionData,
        }
    }

    async retrievePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {

        return paymentSessionData;
    }

    async getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus> {

        return PaymentSessionStatus.AUTHORIZED;
    }

    async updatePaymentData(sessionId: string,data: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
        return data
    }

    async deletePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
        return paymentSessionData
    }

    async capturePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
        return {
            status: "captured",
        }
    }

    async refundPayment(paymentSessionData: Record<string, unknown>, refundAmount: number): Promise<Record<string, unknown> | PaymentProcessorError> {
        return {
            id: "test",
        }
    }

    async cancelPayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
        return {
            id: "test",
        }
    }
}

export default KonnectPaymentProcessor