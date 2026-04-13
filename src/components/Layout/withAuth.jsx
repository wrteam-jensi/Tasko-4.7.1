"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useSelector } from "react-redux";
import Loader from "../ReUseableComponents/Loader";
import { useIsLogin } from "@/utils/Helper";

const withAuth = (WrappedComponent) => {

    const Wrapper = (props) => {

        const router = useRouter();
        const isLoggedIn = useIsLogin(); // Reactive hook - automatically updates when login state changes
        const userData = useSelector((state) => state.userData);
        const [isAuthorized, setIsAuthorized] = useState(false);
        const [authChecked, setAuthChecked] = useState(false)



        const isLandingPage = router.pathname === "/home";
        const locationData = useSelector(state => state.location);

        useEffect(() => {
            const privateRoutes = [
                '/cart',
                '/chats',
                '/checkout',
                '/general-bookings',
                '/requested-bookings',
                '/bookmarks',
                '/my-services-requests',
                '/addresses',
                '/notifications',
                '/payment-status',
                '/payment-history',
                '/booking/[...slug]',
                '/profile',
            ];
            const isPrivateRoute = privateRoutes.includes(router.pathname);
            const isLocationRequiredRoute = ['/my-services-requests'].includes(router.pathname);
            const hasLocation = locationData?.lat && locationData?.lng;

            if (isPrivateRoute && !isLoggedIn) {
                router.push("/");
            } else if (isLocationRequiredRoute && !hasLocation) {
                // specific check: if route requires location but user doesn't have it
                router.push("/");
            } else {
                setIsAuthorized(true)
            }
            setAuthChecked(true)

            // Existing logic: Redirect to main page if on landing page with location set
            if (isLandingPage && hasLocation) {
                router.push("/");
            }
        }, [userData, router])
        if (!authChecked) {
            return <Loader />;
        }

        return isAuthorized ? <WrappedComponent {...props} /> : null;
    }
    return Wrapper;
}

export default withAuth;