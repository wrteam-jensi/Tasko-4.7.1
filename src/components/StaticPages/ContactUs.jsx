import { useState } from "react";
import {
  FaClock,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhoneAlt,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import Layout from "../Layout/Layout";
import BreadCrumb from "../ReUseableComponents/BreadCrumb";
import { contactUsApi } from "@/api/apiRoutes";
import { useTranslation } from "../Layout/TranslationContext";
import { useIsDarkMode } from "@/utils/Helper";

const ContactUs = () => {
  const t = useTranslation();
  const isDarkMode = useIsDarkMode();
  const settingsData = useSelector((state) => state?.settingsData);

  const general_settings = settingsData?.settings?.general_settings;
  const mapSrc = general_settings?.company_map_location;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Destructure form data
    const { name, email, subject, message } = formData;
    if (!name || !email || !subject || !message) {
      // Show error toast if any field is missing
      toast.error(t("allFieldsAreRequired")); // Show an error toast
    } else {
      try {
        const response = await contactUsApi({
          name: name,
          email: email,
          subject: subject,
          message: message,
        });
        toast.success(t("messageSentSuccessfully"));
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <Layout>
      <BreadCrumb firstEle={t("contactUs")} firstEleLink="/contact-us" />
      <section className="contact-us my-12 container mx-auto">
        <h2 className="text-3xl font-semibold mb-8">{t("contactUs")}</h2>
        <div className=" gap-12 flex flex-col-reverse lg:grid grid-cols-12">
          {/* Left Side */}
          <div className="col-span-12 lg:col-span-7 order-2 lg:order-1">
            {/* Contact Information */}
            <div className="grid grid-cols-1">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Phone */}
                {general_settings?.phone &&
                  <div className="flex items-center space-x-4 gap-2">
                    <FaPhoneAlt
                      className="primary_text_color light_bg_color p-2 rounded-full min-w-[36px] min-h-[36px]"
                      size={36}
                    />
                    <div>
                      <h3 className="description_color font-normal">
                        {t("callUs")}
                      </h3>
                      <p className="text-lg font-semibold">
                        {general_settings?.phone}
                      </p>
                    </div>
                  </div>
                }

                {/* Email */}
                {general_settings?.support_email &&
                  <div className="flex items-center space-x-4 gap-2">
                    <FaEnvelope
                      className="primary_text_color light_bg_color p-2 rounded-full min-w-[36px] min-h-[36px]"
                      size={36}
                    />
                    <div>
                      <h3 className="description_color font-normal">
                        {t("mailUs")}
                      </h3>
                      <p className="text-lg font-semibold">
                        {general_settings?.support_email}
                      </p>
                    </div>
                  </div>
                }

                {/* Opening Hours */}
                {general_settings?.support_hours &&
                  <div className="flex items-center space-x-4 gap-2">
                    <FaClock
                      className="primary_text_color light_bg_color p-2 rounded-full min-w-[36px] min-h-[36px]"
                      size={36}
                    />
                    <div>
                      <h3 className="description_color font-normal">
                        {t("openingHours")}
                      </h3>
                      <p className="text-lg font-semibold">
                        {general_settings?.support_hours}
                      </p>
                    </div>
                  </div>
                }
              </div>
              <div>
                {/* Address */}
                {general_settings?.address &&
                  <div className="flex items-center space-x-4 gap-2 col-span-1 sm:col-span-2 lg:col-span-3 mt-6">
                    <FaMapMarkerAlt
                      className="primary_text_color light_bg_color p-2 rounded-full min-w-[36px] min-h-[36px]"
                      size={36}
                    />
                    <div>
                      <h3 className="description_color font-normal">
                        {t("reachUs")}
                      </h3>
                      <p className="text-lg font-semibold">
                        {general_settings?.address}
                      </p>
                    </div>
                  </div>
                }
              </div>
            </div>

            {/* Map */}
            <div className="mt-8 w-full h-[400px]">
              <iframe
                title={t("map")}
                src={`${mapSrc}`}
                width="100%"
                height="100%"
                className="rounded-md border"
                allowFullScreen="true"
                loading="lazy"
                style={{ filter: isDarkMode ? " invert(90%)" : "none" }}
              ></iframe>
            </div>
          </div>

          {/* Right Side: Contact Form */}
          <div className="col-span-12 lg:col-span-5 order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t("yourName")}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring focus:ring-transparent"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t("email")}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring focus:ring-transparent"
              />
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder={t("subject")}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring focus:ring-transparent"
              />
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={t("whatIsinyourMind")}
                rows={10}
                className="w-full p-3 border rounded-md focus:outline-none focus:ring focus:ring-transparent"
              ></textarea>
              <button
                type="submit"
                className="w-full p-3 border rounded-md primary_bg_color transition text-white"
              >
                {t("submitMessage")}
              </button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ContactUs;
