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
var request = require('request');


// TODO : check the payment page from konnect to see if you can send the data yourself (care about the first_name and that stuff)

// ########## success_url on the payment should lead to the order successful page ##########
// meaning: clicking on "commander" button => konnect payment page => if (success_url => order successful page) else (fail_url => order failed page)
// Also, think for a global variable inside the payment processor to know if the payment is successful or not (to be able to change the order status)
class KonnectPaymentProcessor extends AbstractPaymentProcessor {
static identifier = "konnect";

constructor(container, options) {
    super(container);
    require('dotenv').config();
}

protected async initPaymentAPI(postData) {
    var content = {
        "receiverWalletId": process.env.WALLET_ID,
        "token": postData.currency_code.toUpperCase(),
        "amount": postData.amount,
        "type": "immediate",
        "description": "payment description",
        "lifespan": 10,
        "checkoutForm": true,
        "addPaymentFeesToAmount": true,
        "firstName": postData.customer.first_name || postData?.firstName || "john",
        "lastName": postData.customer.last_name || postData?.lastName || "doe",
        "phoneNumber": postData.customer.phone || postData?.phoneNumber || "00000000",
        "email": postData.email || "",
        "orderId": postData.resource_id,
        "webhook": process.env.BACKEND_URL+"/api/notification_payment",
        "silentWebhook": true,
        "successUrl": process.env.BACKEND_URL+"/gateway/payment-success",
        "failUrl": process.env.BACKEND_URL+"/gateway/payment-failure",
        "theme": "light",
    }
    console.log("CONTENT: ",content);
    
    // "http://localhost:3000/",
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
    console.log("INITIATE_PAYMENT");
    console.log(context);

    const res: any = await this.initPaymentAPI(context);
    const session_data = {
        ...res,
        "token": context.currency_code,
        "amount": context.amount,
        "firstName": context.customer.first_name || context.billing_address?.first_name || context.paymentSessionData?.firstName || "",
        "lastName": context.customer.last_name || context.billing_address?.last_name || context.paymentSessionData?.lastName || "",
        "phoneNumber": context.customer.phone || context.billing_address?.phone || context.paymentSessionData?.phoneNumber || "",
        "email": context.customer.email,
    }
    console.log("Session_DATA_INIT: ", session_data);

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

    console.log("UPDATE_PAYMENT");
    console.log(session_data);

    const update_requests = {
        customer_metadata: context.customer.metadata,
    }

    return {
        session_data,
        update_requests,
    }
}

// Always minimal implementation here
async authorizePayment(paymentSessionData: Record<string, unknown>, context: Record<string, unknown>): Promise<PaymentProcessorError | {status: PaymentSessionStatus; data: Record<string, unknown>; }>{
    console.log("AUTHORIZE_PAYMENT");
    console.log(paymentSessionData);
    console.log(context);

    return {
        status: PaymentSessionStatus.AUTHORIZED,
        data: paymentSessionData,
    }
}

// TO DO : From the data received in authorizePayment (paymentRef), check if you can manually change the status of the payment in the api section, no need to go here. (hacky way)
async retrievePayment(paymentSessionData: Record<string, unknown>): Promise<Record<string, unknown> | PaymentProcessorError> {
    console.log("RETRIEVE_PAYMENT");
    console.log(paymentSessionData);

    return paymentSessionData;
}

async getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus> {
    console.log("GET_PAYMENT_STATUS");
    console.log(paymentSessionData);

    return PaymentSessionStatus.AUTHORIZED;
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
    console.log(paymentSessionData);
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