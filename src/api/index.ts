import { Order, OrderService } from "@medusajs/medusa";
import { Router } from "express"
import { EntityManager } from "typeorm"

const dotenv = require("dotenv");
var request = require('request');

export default (rootDirectory, options) => {
    const router = Router()
    router.get('/api/notification_payment', async function (req, res) {
        res.status(200).end();

        const manager: EntityManager = req.scope.resolve("manager");
        const orderRepo = manager.getRepository(Order);
        const orderService: OrderService = req.scope.resolve("orderService");

        var clientServerOptions = {
            uri: "https://api.preprod.konnect.network/api/v2/payments/"+req.query['payment_ref'],
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.KONNECT_APIKEY
            }
        }

        // KEEP TESTING WITH THIS : http://localhost:9000/api/notification_payment?payment_ref=65513397a27660296285cb7b ( cart : cart_01HF2JHX89BQ22T6TBK55N88CY )
        await request(clientServerOptions, async function (err, res) {
            if (err) {
                console.log('ERROR_HERE1');
                return {"error": "Error."};
            } else {
                try {
                    const payment = JSON.parse(res.body)["payment"];
                    console.log("CALLBACK_RESULT: ", payment);
                    console.log("CALLBACK_RESULT: ", payment.transactions[1].status);
                    if(payment.status == "completed" && payment.transactions[1].status == "success") {
                        let cartId;
                        let orderId;
                        try {
                            cartId = payment.orderId;
                            orderId = await orderRepo.findOne({ where: {cart_id: cartId} });
                            orderService.capturePayment(orderId.id);
                        } catch {}
                        console.log("cartId: ", cartId);
                        console.log("orderId: ", orderId);
                        console.log("orderId: ", orderId.id);
                    } else
                        console.log("payment_not_success");
                } catch (error) {
                    console.log('ERROR_HERE2');
                    return {"error": "Error."};
                }
            }
        });
        res.status(200).end();
    })

    router.get('/gateway/payment-success', function (req, res) {
        console.log("####PAYMENT_SUCCESS####");
        
        console.log(req);
        console.log(req.query);
        console.log(req.body);

        res.status(200).send("success")

        // Place the order
    })

    router.get('/gateway/payment-failure', function (req, res) {
        console.log("####PAYMENT_FAILURE####");
        
        res.status(200).send("failure")
    })
  
    return router
}