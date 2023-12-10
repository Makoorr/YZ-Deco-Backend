import type { ProductDetailsWidgetProps, WidgetConfig } from "@medusajs/admin"
import { useState, useRef, useEffect } from "react";
import Medusa from "@medusajs/medusa-js"

const ProductWidget = ({
    product,
    notify,
  }: ProductDetailsWidgetProps) => {
    const medusa = new Medusa({ baseUrl: process.env.MEDUSA_ADMIN_BACKEND_URL, maxRetries: 3 })

    const [textOption, setTextOption] = useState<boolean | null>(null);
    const [imageOption, setImageOption] = useState<boolean | null>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLDivElement>(null);
    const errorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
          try {
            const textImageOptions = await medusa.admin.auth.client.request(
              "GET",
              `/customizedproduct/${product.id}`
            );
    
            setTextOption(textImageOptions.has_text);
            setImageOption(textImageOptions.has_image);
          } catch (error) {
            console.error("Error fetching data:", error);
          }
        };
    
        fetchData();
      }, [product.id]);

    const inputClass = "w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600";
    const labelClass = "mr-5 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300";

    const handleTextOptionChange = async (option: string) => {
        (option == "yes") ? setTextOption(true) : setTextOption(false);
        textRef.current.childNodes.forEach((child: HTMLElement) => {
            if (child.tagName === "INPUT") {
                const inputElement = child as HTMLInputElement;
                inputElement.disabled = true;
            }
        });

        medusa.admin.auth.client.request(
            "POST",
            `/customizedproduct/${product.id}`,
            { has_text: option == "yes" }
        ).then((res) => {
            if(!res.affected)
                throw new Error("Une erreur est survenue lors de la mise à jour du produit.");
            location.reload();
        }).catch((error) => {
            errorRef.current.innerHTML = "Une erreur est survenue lors de la mise à jour du produit.";
        });
    };

    const handleImageOptionChange = (option: string) => {
        (option == "yes") ? setImageOption(true) : setImageOption(false);
        imageRef.current.childNodes.forEach((child: HTMLElement) => {
            if (child.tagName === "INPUT") {
                const inputElement = child as HTMLInputElement;
                inputElement.disabled = true;
            }
        });

        medusa.admin.auth.client.request(
            "POST",
            `/customizedproduct/${product.id}`,
            { has_image: option == "yes" }
        ).then((res) => {
            if(!res.affected)
                throw new Error("Une erreur est survenue lors de la mise à jour du produit.");
            location.reload();
        }).catch((error) => {
            errorRef.current.innerHTML = "Une erreur est survenue lors de la mise à jour du produit.";
        });
    };

    return (
    <div className="flex space-x-4 mt-4">
        <div className="rounded-rounded bg-grey-0 border-grey-20 flex h-full w-full flex-col overflow-hidden border min-h-[350px] min-h-[200px] w-full">
            <div className="flex grow flex-col">

                <div className="px-xlarge py-large">
                    <div className="flex items-start justify-between">
                        <h1 className="inter-xlarge-semibold text-grey-90">Ce produit est-il personnalisable?</h1>
                        <div className="flex items-center space-x-2">
                            
                        </div>
                    </div>
                    <p>Vous pouvez changer l&apos;état du produit ici.</p>
                </div>

                <div className="px-xlarge flex">
                    <fieldset className="basis-1/2 p-4 flex flex-col gap-4">
                        <legend className="text-large font-medium">Description par texte</legend>
                        <div ref={textRef}>
                            <input
                                type="radio"
                                value="yes"
                                checked={textOption === true}
                                onChange={() => handleTextOptionChange("yes")}
                                className={`peer/textYes ${inputClass}`}
                                />
                            <label className={`peer-checked/textYes:text-sky-800 ${labelClass}`}>Oui</label>
                            <input
                                type="radio"
                                value="no"
                                checked={textOption === false}
                                onChange={() => handleTextOptionChange("no")}
                                className={`peer/textNo ${inputClass}`}
                                />
                            <label className={`peer-checked/textNo:text-sky-800 ${labelClass}`}>Non</label>
                        </div>
                    </fieldset>
                    <fieldset className="basis-1/2 p-4 flex flex-col gap-4">
                        <legend className="text-large font-medium">Description par image</legend>
                        <div ref={imageRef}>
                            <input
                                type="radio"
                                value="yes"
                                checked={imageOption === true}
                                onChange={() => handleImageOptionChange("yes")}
                                className={`peer/imageYes ${inputClass}`}
                                />
                            <label className={`peer-checked/imageYes:text-sky-800 mr-5 ${labelClass}`}>Oui</label>
                            <input
                                type="radio"
                                value="no"
                                checked={imageOption === false}
                                onChange={() => handleImageOptionChange("no")}
                                className={`peer/imageNo ${inputClass}`}
                                />
                            <label className={`peer-checked/imageNo:text-sky-800 ${labelClass}`}>Non</label>
                        </div>
                    </fieldset>
                </div>
                    <span ref={errorRef} className="px-xlarge text-red-500 font-medium"></span>
            </div>
        </div>
    </div>
    )
}

export const config: WidgetConfig = {
  zone: "product.details.after",
}

export default ProductWidget