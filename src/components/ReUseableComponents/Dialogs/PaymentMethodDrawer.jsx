import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTranslation } from "@/components/Layout/TranslationContext";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import MiniLoader from "../MiniLoader";

const PaymentMethodDrawer = ({
  open,
  onClose,
  onSubmit,
  amount,
  isLoading = false,
  enabledPaymentMethods,
  selectedMethod,
  setSelectedMethod
}) => {
  const t = useTranslation();


  const handleSubmit = () => {
    if (!selectedMethod) return;
    onSubmit(selectedMethod);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl p-0 mx-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold">{t("selectPaymentMethod")}</h2>
          </div>

          {/* Payment Methods Grid */}
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-[300px] overflow-y-auto">
              {enabledPaymentMethods?.map((method) => (
                <div
                  key={method?.method}  
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg cursor-pointer border transition-all ${selectedMethod === method?.method
                      ? "border_color light_bg_color primary_text_color"
                      : "border-gray-200 hover:light_bg_color"
                    }`}
                  onClick={() => setSelectedMethod(method?.methodType)}
                >
                  {/* Payment Method Icon */}
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex-shrink-0">
                    <AvatarImage
                      src={method?.methodIcon?.src}
                      alt={method?.method}
                      className="object-contain p-1"
                    />
                  </Avatar>

                  {/* Payment Method Name */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium capitalize text-sm sm:text-base truncate">
                      {t(method?.method)}
                    </h3>
                  </div>

                  {/* Selection Radio */}
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                    {selectedMethod === method?.methodType && (
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full primary_bg_color" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Section */}
          <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
            {/* Final Price */}
            <div className="flex justify-between items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-base sm:text-lg font-semibold">{t("finalPrice")}</span>
              <span className="text-base sm:text-lg font-semibold primary_text_color">{amount}</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!selectedMethod || isLoading}
              className={`w-full py-3 sm:py-4 px-4 rounded-lg text-white dark:text-black font-medium text-sm sm:text-base transition-all ${!selectedMethod || isLoading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "primary_bg_color hover:bg-primary/90 active:scale-95"
                }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <MiniLoader />
                  <span className="ml-2">{t("processing")}</span>
                </div>
              ) : (
                t("proceedToPay")
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodDrawer;