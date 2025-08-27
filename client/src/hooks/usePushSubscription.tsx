import { useEffect } from "react";
import { useAuth } from "react-oidc-context";

export function usePushSubscription() {

     const  auth = useAuth();
     const token = auth?.user?.id_token;
  useEffect(() => {
    if (!token) return; // only after login

    const subscribeUser = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("Push notifications not supported");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notifications denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      // ✅ Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
       if (!subscription) {
        // if no subscription, create a new one
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            "BLehCctQmjYWGshN4pPtx8NjbnZ3uoFv4mu5dLEGZtkURLYJsn7wTm6Z2VdBwDglKYOoaL_s5cHiQktw1c13V5Y",
        });
        console.log("New push subscription created:", subscription);
      } else {
        console.log("Already subscribed:", subscription);
      }

    

      // const subscription = await registration.pushManager.subscribe({
      //   userVisibleOnly: true,
      //   applicationServerKey: "BLehCctQmjYWGshN4pPtx8NjbnZ3uoFv4mu5dLEGZtkURLYJsn7wTm6Z2VdBwDglKYOoaL_s5cHiQktw1c13V5Y", // from your server
      // });
      // console.log("Push subscription:", subscription);

      // send subscription to backend
      await fetch("/api/subscribe", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // so backend knows the user
        },
      });

      console.log("Push subscription sent to server");
    };

    subscribeUser();
  }, [token]);
  
}
