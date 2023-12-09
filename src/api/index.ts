import { Order, OrderService } from "@medusajs/medusa";
import { Router } from "express"
import { EntityManager } from "typeorm"
import cors from "cors"
import KonnectPaymentProcessor from "../services/konnect-payment-processor";

const dotenv = require("dotenv");
const express = require('express');
const request = require('request');
const { v4: uuidv4 } = require('uuid');

const {
    S3,
    S3Client,
} = require('@aws-sdk/client-s3')
const multer  = require('multer');
const multerS3  = require('multer-s3');

export default (rootDirectory, options) => {
    const router = Router()
    const DEBUG = process.env.DEBUG || false;
    router.use('/konnect-payUrl',cors())
    router.use(express.json())
    router.get('/api/notification_payment', async function (req, res) {
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

        await request(clientServerOptions, async function (err, res) {
            if (err) {
                return {"error": "Error."};
            } else {
                try {
                    const payment = JSON.parse(res.body)["payment"];
                    if(payment.status == "completed" && payment.transactions[1].status == "success") {
                        let cartId;
                        let orderId;
                        try {
                            cartId = payment.orderId;
                            orderId = await orderRepo.findOne({ where: {cart_id: cartId} });
                            orderService.capturePayment(orderId.id);
                        } catch {}
                    }
                } catch (error) {
                    return {"error": "Error."};
                }
            }
        });
        res.status(200).end();
    })

    // This api generates the payUrl for the cartId sent in query and returns that payUrl
    router.post('/konnect-payurl', async function (req, res) {
        try {
            (DEBUG) && console.log("PAYURL");
            (DEBUG) && console.log(req.body);
            const order = req.body;
            const konnectPayment: KonnectPaymentProcessor = req.scope.resolve("konnectPaymentProcessorService");

            var content = {
                "currency_code": order.currency_code,
                "amount": order.total,
                "customer": {
                    "first_name": order.shipping_address.first_name,
                    "last_name": order.shipping_address.last_name,
                    "phone": order.shipping_address.phone,
                },
                "email": order.email,
                "resource_id": order.cart_id,
            };

            (DEBUG) && console.log("content", content);
            
            const result: Object = await konnectPayment.initPaymentAPI(content);
            (DEBUG) && console.log("result", result);
            return res.json(result);
        } catch (error) {
            return res.status(500);
        }
    })

    // this redirects to frontend only ( no need to be authenticated )
    router.get('/gateway/payment-success', async function (req, res) {
        // get cartId from query -> get orderId from cartId -> redirect user to frontend/order/confirmed/orderId
        const manager: EntityManager = req.scope.resolve("manager");
        const orderRepo = manager.getRepository(Order);
        let cartId;
        let orderId;
        try {
            if (req.query['order_id']) {
                orderId = req.query['order_id'];
            } else if(req.query['cart_id']) {
                cartId = req.query['cart_id'];
                orderId = await orderRepo.findOne({ where: {cart_id: cartId} });
            }
        } catch {}

        res.redirect(process.env.FRONTEND_URL+"/order/confirmed/"+orderId.id);
    })

    // this redirects to frontend only ( no need to be authenticated )
    router.get('/gateway/payment-failure', async function (req, res) {
        // get cartId from query -> get orderId from cartId -> redirect user to frontend/order/confirmed/orderId
        const manager: EntityManager = req.scope.resolve("manager");
        const orderRepo = manager.getRepository(Order);
        let cartId;
        let orderId;
        try {
            if (req.query['order_id']) {
                orderId = req.query['order_id'];
            } else if(req.query['cart_id']) {
                cartId = req.query['cart_id'];
                orderId = await orderRepo.findOne({ where: {cart_id: cartId} });
            }
        } catch {}

        res.redirect(process.env.FRONTEND_URL+"/order/confirmed/"+orderId.id);
    })
    
    const s3 = new S3({
        region: process.env.S3_REGION,

        credentials : {
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
        },
    });
    
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    const upload = multer ({
        storage: multerS3({
            s3: s3,
            bucket: process.env.S3_BUCKET,
            acl: 'public-read',
            key: (req, file, cb) => {
                if (!allowedImageTypes.includes(file.mimetype)) {
                    return cb(new Error('Invalid file type'), false);
                }

                const filename = `${uuidv4()}.jpg`;
                cb(null, filename);
            },
        }),
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
        fileFilter: (req, file, cb) => {
            if (!allowedImageTypes.includes(file.mimetype)) {
              return cb(new Error('Invalid file type'), false);
            }
            cb(null, true);
          },
    });

    router.use('/upload',cors())
    router.post('/upload', upload.single('image'), function (req, res) {
        res.send({
            message: "uploaded",
            file: {...req.file},
        });
    })
    return router
}