import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCA5jv4oA0iw900gEVQOI_Q7Yd8obyNjcA",
  authDomain: "rockvilleapp-b3671.firebaseapp.com",
  projectId: "rockvilleapp-b3671",
  storageBucket: "rockvilleapp-b3671.appspot.com",
  messagingSenderId: "798242577804",
  appId: "1:798242577804:web:31394f46cb553e98c9caa9",
  measurementId: "G-9J8E35VCES"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
