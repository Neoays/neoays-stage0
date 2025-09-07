"use client";
import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, setLogLevel } from 'firebase/firestore';
import type { FirebaseError } from 'firebase/app';

// Define the global Firebase variables. These are automatically provided by the environment.
const appId = process.env.NEXT_PUBLIC_APP_ID || 'neoays-stage0';
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
};
const initialAuthToken = null;
setLogLevel('debug');

// Initialize Firebase services.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function App() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReserved, setIsReserved] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isSignUpSuccessful, setIsSignUpSuccessful] = useState(false);
  const [randomId, setRandomId] = useState("");

  useEffect(() => {
    if (!randomId) {
      setRandomId(crypto.randomUUID());
    }
  }, [randomId]);

  // Use the authenticated user ID, or a stable random ID after mount
  const userId = currentUser?.uid || randomId || "";

  useEffect(() => {
    // Sign in with the custom token if provided.
    const signIn = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Firebase Auth Error:", e);
        setError("Failed to authenticate. Please try again.");
      }
    };

    // Set up the auth state observer.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    signIn();

    // Clean up the subscription on unmount.
    return () => unsubscribe();
  }, []);

  // Function to check if the username is available in the public Firestore collection.
  const checkUsername = async () => {
    if (username.length < 3) {
      setIsAvailable(false);
      setError("Username must be at least 3 characters long.");
      return;
    }
    setError('');
    setIsLoading(true);
    setIsAvailable(null);

    try {
      const usernameDocPath = `/artifacts/${appId}/public/data/usernames/${username}`;
      const docRef = doc(db, usernameDocPath);
      const docSnap = await getDoc(docRef);

      setIsAvailable(!docSnap.exists());
    } catch (e) {
      const err = e as FirebaseError;
      console.error("Error checking username:", err);
      if (
        typeof err === "object" &&
        err !== null &&
        typeof err.code === "string"
      ) {
        if (
          err.code === "unavailable" ||
          (err.message && err.message.includes("offline"))
        ) {
          setError("Cannot check username while offline. Please check your internet connection.");
        } else {
          setError("An error occurred while checking the username.");
        }
      } else {
        setError("An unknown error occurred while checking the username.");
      }
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reserve the username by creating a public document.
  const reserveUsername = async () => {
    if (!currentUser) {
      setError("You must be signed in to reserve a username.");
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const usernameDocPath = `/artifacts/${appId}/public/data/usernames/${username}`;
      const docRef = doc(db, usernameDocPath);

      // Save the username and link it to the current user's ID.
      await setDoc(docRef, { userId: currentUser.uid });
      setIsReserved(true);
    } catch (e) {
      console.error("Error reserving username:", e);
      setError("Failed to reserve the username. It might be taken.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new user with email and password, and save mobile number.
  const handleSignUp = async () => {
    if (!email || !password || !mobileNumber) {
      setError("All fields are required.");
      return;
    }
    if (!privacyAccepted) {
      setError("You must accept the privacy policy to continue.");
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      // Create a new user with email and password.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the public username record with the new user ID if it was created anonymously.
      if (currentUser && currentUser.isAnonymous) {
        const usernameDocPath = `/artifacts/${appId}/public/data/usernames/${username}`;
        const docRef = doc(db, usernameDocPath);
        await setDoc(docRef, { userId: user.uid }, { merge: true });
      }

      // Save the user's mobile number and reserved username to their private Firestore profile.
      const profileDocPath = `/artifacts/${appId}/users/${user.uid}/profile/data`;
      const profileRef = doc(db, profileDocPath);
      await setDoc(profileRef, {
        username: username,
        email: email,
        mobileNumber: mobileNumber,
      });

      // Show a success message.
      setIsSignUpSuccessful(true);
      setIsReserved(false); // Reset state to hide the form.

    } catch (e) {
      const err = e as FirebaseError;
      console.error("Error during sign-up:", err);
      if (
        typeof err === "object" &&
        err !== null &&
        typeof err.code === "string"
      ) {
        if (err.code === 'auth/email-already-in-use') {
          setError("This email is already in use. Please sign in or use a different email.");
        } else if (err.code === 'auth/weak-password') {
          setError("Password is too weak. Please use a stronger password.");
        } else {
          setError(`Sign-up failed: ${err.message}`);
        }
      } else {
        setError("An unknown error occurred during sign-up.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        {/* Header */}
        <h1 className="mb-2 text-3xl font-bold text-gray-800">
          Reserve your Neoays ID
        </h1>
        <p className="mb-6 text-gray-600">
          Check and reserve your unique username.
        </p>
        {userId && (
          <p className="mb-4 text-xs font-mono text-gray-400">
            Your User ID: {userId}
          </p>
        )}
        {isSignUpSuccessful ? (
            <div className="text-green-600 font-medium text-lg mt-4 animate-fade-in">
              ✅ Your Neoays ID is reserved! Welcome!
            </div>
        ) : (
            <>
              {/* Dynamic Content based on state */}
              {!isReserved ? (
                <>
                  {/* Username Check Form */}
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="Enter your desired username"
                    className="w-full rounded-lg border border-gray-300 p-3 text-center transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={checkUsername}
                    disabled={isLoading || username.length < 3}
                    className="mt-4 w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {isLoading ? "Checking..." : "Check Availability"}
                  </button>

                  {/* Status Messages */}
                  {isLoading && (
                    <p className="mt-4 text-gray-500 animate-pulse">
                      Checking database...
                    </p>
                  )}
                  {isAvailable !== null && !isLoading && (
                    <div className="mt-4">
                      {isAvailable ? (
                        <div className="text-green-600 font-medium">
                          <p>✅ Username is available!</p>
                          <button
                            onClick={reserveUsername}
                            className="mt-2 w-full rounded-lg bg-green-500 px-4 py-3 font-semibold text-white transition hover:bg-green-600"
                          >
                            Reserve Now
                          </button>
                        </div>
                      ) : (
                        <p className="text-red-600 font-medium">
                          ❌ That name is taken or too short.
                        </p>
                      )}
                    </div>
                  )}
                  {error && (
                    <p className="mt-4 text-red-500 font-medium">{error}</p>
                  )}
                </>
              ) : (
                <>
                  {/* Signup Form */}
                  <p className="mb-4 text-lg font-medium text-blue-600">
                    Username <span className="font-bold">@{username}</span> is
                    reserved.
                  </p>
                  <p className="mb-4 text-sm text-gray-600">
                    Complete your profile to secure your ID.
                  </p>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your Email Address"
                    className="w-full rounded-lg border border-gray-300 p-3 mb-2 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a Password"
                    className="w-full rounded-lg border border-gray-300 p-3 mb-2 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Mobile Number"
                    className="w-full rounded-lg border border-gray-300 p-3 mb-4 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />

                  <div className="flex items-center justify-center mb-4">
                    <input
                      type="checkbox"
                      id="privacy"
                      checked={privacyAccepted}
                      onChange={() => setPrivacyAccepted(!privacyAccepted)}
                      className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="privacy" className="ml-2 text-sm text-gray-600">
                      I accept the{" "}
                      <span
                        onClick={() => setIsPrivacyModalOpen(true)}
                        className="text-blue-500 hover:underline cursor-pointer"
                      >
                        Privacy Policy
                      </span>
                    </label>
                  </div>
                  <button
                    onClick={handleSignUp}
                    disabled={isLoading || !privacyAccepted}
                    className="w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    {isLoading ? "Signing Up..." : "Complete Sign Up"}
                  </button>
                  {error && (
                    <p className="mt-4 text-red-500 font-medium">{error}</p>
                  )}
                </>
              )}
            </>
        )}
      </div>

      {/* Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Privacy Policy</h2>
            <p className="text-gray-700">
              Your email address and mobile number are collected to facilitate
              communication and account recovery. Your username is stored publicly
              to ensure its uniqueness. We use Firebase services to securely
              store your data. Your mobile number will be used for account-related
              notifications and security. We will not sell your data.
            </p>
            <button
              onClick={() => setIsPrivacyModalOpen(false)}
              className="mt-6 w-full rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
