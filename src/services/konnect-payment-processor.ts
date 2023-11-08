import { 
    AbstractPaymentProcessor, 
    PaymentProcessorContext, 
    PaymentProcessorError, 
    PaymentProcessorSessionResponse, 
    PaymentSessionStatus,
    isPaymentProcessorError,
} from "@medusajs/medusa"
import { EOL } from "os";

const bodyParser = require("body-parser")
const express = require('express');
// const router = express.Router();
const app = express();
app.use(bodyParser.json())
var request = require('request');


// TODO : check the payment page from konnect to see if you can send the data yourself (care about the first_name and that stuff)
class KonnectPaymentProcessor extends AbstractPaymentProcessor {
static identifier = "konnect";

constructor(container, options) {
    super(container);
    require('dotenv').config();
}

protected async initPaymentAPI(postData) {
    var content = {
        "receiverWalletId": process.env.WALLET_ID,
        "token": postData.currency_code,
        "amount": postData.paymentSessionData?.amount || postData.amount,
        "type": "immediate",
        "description": "payment description",
        "acceptedPaymentMethods": [
            "wallet",
            "bank_card",
            "e-DINAR"
        ],
        "lifespan": 10,
        "checkoutForm": true,
        "addPaymentFeesToAmount": true,
        "firstName": postData.firstName || "john",
        "lastName": postData.lastName || "doe",
        "phoneNumber": postData.phoneNumber || "00000000",
        "email": postData.email || "",
        "webhook": "https://yz-deco-backend-production.up.railway.app/api/notification_payment",
        "silentWebhook": true,
        "successUrl": "https://yz-deco-backend-production.up.railway.app/gateway/payment-success",
        "failUrl": "https://yz-deco-backend-production.up.railway.app/gateway/payment-failure",
        "theme": "light",
    }
    
    // "https://api.preprod.konnect.network/api/v2/payments/init-payment",
    var clientServerOptions = {
        uri: "http://localhost:3000/",
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
                resolve({status: res.statusCode, body: JSON.parse(res.body)}); // Resolve the Promise with res.body
            } catch (error) {
                reject(error); // Reject the Promise if there's an error
            }
        }
        });
    });
}

protected async getPaymentAPI() {
    console.log("GET_PAYMENT_API");

    app.post('/api/notification_payment', (req, res) => { // implement this on your local server
        console.log("POST_RECEIVED") // Call your action on the request here
        console.log(req.body) // Call your action on the request here
        const data = JSON.parse(req.body);
        this.getPaymentStatus(data);
        res.status(200).end() // Some endpoints need the 200 response
    });

    // Return a Promise for the asynchronous operation
    // return new Promise((resolve, reject) => {
    //     setTimeout(() => {
    //         request(clientServerOptions, function (err, res) {
    //             if (err) {
    //                 console.log('ERROR_HERE1');
    //                 reject(err); // Reject the Promise in case of an error
    //             } else {
    //                 try {
    //                     console.log('ARRIVED_HERE');
    //                     resolve({status: res.statusCode, body: JSON.parse(res.body)}); // Resolve the Promise with res.body
    //                 } catch (error) {
    //                     console.log('ERROR_HERE2');
    //                     reject(error); // Reject the Promise if there's an error
    //                 }
    //             }
    //         });
    //     }, 600000);
    //     reject("Payment not updated"); // Reject the Promise in case of an error
    // });
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
    const session_data = {
        "token": context.currency_code,
        "amount": context.amount,
        "firstName": context.customer.first_name || context.billing_address?.first_name || context.paymentSessionData?.firstName || "",
        "lastName": context.customer.last_name || context.billing_address?.last_name || context.paymentSessionData?.lastName || "",
        "phoneNumber": context.customer.phone || context.billing_address?.phone || context.paymentSessionData?.phoneNumber || "",
        "email": context.customer.email,
    }

    const update_requests = {
        customer_metadata: {
            "metadata": context.customer.metadata,   
        },
    }
    console.log("INITIATE_PAYMENT");
    console.log(context);

    return {
        session_data,
        update_requests,
    }
}

async updatePayment(context: PaymentProcessorContext): Promise<void | PaymentProcessorError | PaymentProcessorSessionResponse> {
    const session_data = {
        "amount": context.amount,
        "firstName": context.customer.first_name || context.paymentSessionData?.firstName || context.billing_address?.first_name || "",
        "lastName": context.customer.last_name || context.paymentSessionData?.lastName || context.billing_address?.last_name || "",
        "phoneNumber": context.customer.phone || context.paymentSessionData?.phoneNumber || context.billing_address?.phone || "",
        "email": context.customer.email,
    }

    console.log("UPDATE_PAYMENT");
    console.log(context);
    console.log(session_data);

    const update_requests = {
        customer_metadata: context.customer.metadata,
    }

    return {
        session_data,
        update_requests,
    }
}

async authorizePayment(paymentSessionData: Record<string, unknown>, context: Record<string, unknown>): Promise<PaymentProcessorError | {status: PaymentSessionStatus;data: Record<string, unknown>; }>{
    console.log("AUTHORIZE_PAYMENT");
    return {
        status: PaymentSessionStatus.AUTHORIZED,
        data: paymentSessionData,
    }
}

async retrievePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
    console.log("RETRIEVE_PAYMENT");
    console.log(paymentSessionData);
    const res: any = await this.initPaymentAPI(paymentSessionData);

    return {
        status: res.body.status,
        payUrl: res.body.payUrl,
        paymentRef: res.body.paymentRef,
    }
}

async getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus> {
    console.log("GET_PAYMENT_STATUS");
    console.log(paymentSessionData);
    await this.getPaymentAPI();
    
    if(paymentSessionData.payment) {
        console.log("STATUS_200");
        // "https://api.preprod.konnect.network/api/v2/payments/:paymentId",
        const clientServerOptions = {
            uri: "http://localhost:3000/payments/",
            body: JSON.stringify(paymentSessionData.paymentRef),
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        }
        request(clientServerOptions, function (err, res) {
            if (err) {
                console.log('ERROR_HERE1');
                return PaymentSessionStatus.ERROR;
            } else {
                try {
                    console.log('ARRIVED_HERE');
                    console.log(res.body);
                    return PaymentSessionStatus.AUTHORIZED;
                } catch (error) {
                    console.log('ERROR_HERE2');
                    return PaymentSessionStatus.ERROR;
                }
            }
        });
        console.log("After_WAIT");
    }
    return PaymentSessionStatus.PENDING;
}

async updatePaymentData(sessionId: string,data: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
    console.log("UPDATE_PAYMENT_DATA");
    return data
}

async deletePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
    return paymentSessionData
}

async capturePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
    console.log("CAPTURE_PAYMENT");
    return {
        status: "captured",
    }
}

async refundPayment(paymentSessionData: Record<string, unknown>, refundAmount: number): Promise<Record<string, unknown> | PaymentProcessorError> {
    console.log("REFUND_PAYMENT");
    return {
        id: "test",
    }
}

async cancelPayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
    console.log("CANCEL_PAYMENT");
    return {
        id: "test",
    }
}
}

export default KonnectPaymentProcessor