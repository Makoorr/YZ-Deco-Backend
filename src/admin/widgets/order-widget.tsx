import type { WidgetConfig, OrderDetailsWidgetProps } from "@medusajs/admin"
import { useRef, useState } from "react";

interface paymentData {
    payUrl: string,
    paymentRef: string,
}

// Show this widget only if payment is not paid
const OrderWidget = ( {order}: OrderDetailsWidgetProps ) => {
    const linkRef = useRef<HTMLInputElement>(null);

    async function genererPaiement () {
        var content = {
            "receiverWalletId": process.env.MEDUSA_ADMIN_WALLET_ID,
            "token": order.currency_code.toUpperCase(),
            "amount": order.total,
            "type": "immediate",
            "lifespan": 30,
            "checkoutForm": true,
            "addPaymentFeesToAmount": true,
            "firstName": order.customer?.first_name,
            "lastName": order.customer?.last_name,
            "phoneNumber": order.customer?.phone,
            "email": order.email,
            "orderId": order.cart_id,
            "webhook": process.env.MEDUSA_ADMIN_BACKEND_URL+"/api/notification_payment",
            "silentWebhook": true,
            "successUrl": process.env.MEDUSA_ADMIN_BACKEND_URL+"/gateway/payment-success?order_id="+order.id,
            "failUrl": process.env.MEDUSA_ADMIN_BACKEND_URL+"/gateway/payment-failure?order_id="+order.id,
            "theme": "light",
        }
        
        try {
            linkRef.current.innerHTML = "Chargement...";

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("x-api-key", process.env.MEDUSA_ADMIN_KONNECT_APIKEY);
            
            const response = await fetch("https://api.preprod.konnect.network/api/v2/payments/init-payment", {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify(content),
            })

            const data: paymentData = await response.json();
            linkRef.current.innerHTML = `<a href=${data.payUrl} style='color: blue;'>Lien du paiement</a>`;
        } catch (error) {
            linkRef.current.innerHTML = "Erreur";
        }
    };

    return (
        <div className="flex space-x-4 mt-4">
            <div className="rounded-rounded bg-grey-0 border-grey-20 flex h-full w-full flex-col overflow-hidden border min-h-[350px] min-h-[200px] w-full">
                <div className="flex grow flex-col">

                    <div className="px-xlarge py-large">
                        <div className="flex items-start justify-between">
                            <h1 className="inter-xlarge-semibold text-grey-90">Générer Lien du Paiement</h1>
                            <div className="flex items-center space-x-2">
                                <button onClick={genererPaiement} className="btn btn-secondary btn-small min-w-[130px]">
                                    <span className="mr-xsmall last:mr-0">Génerer lien du paiement</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="px-xlarge">
                        <p>Cette commande n&apos;est pas encore payée.<br />Vous pouvez générer un lien du paiement pour envoyer à votre client.</p>
                        <div className="mt-5 flex flex-row gap-5">
                            <span className="font-medium text-grey-90">Lien du paiement: </span>
                            <div ref={linkRef}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const config: WidgetConfig = {
  zone: "order.details.after",
}

export default OrderWidget