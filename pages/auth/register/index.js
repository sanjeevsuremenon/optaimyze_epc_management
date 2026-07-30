import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import EpcLogo from "../../../components/EpcLogo";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignInAlt,
  faHome,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";

function Registerpage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("user");
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const normalizedEmail = String(email || "").trim();
    const trimmedUsername = String(username || "").trim();

    if (!normalizedEmail || !trimmedUsername || !password) {
      setMessage("Please provide a valid email, username and password.");
      return;
    }

    setIsRegistering(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          name: trimmedUsername,
          role,
        }),
        headers: {
          "Content-type": "application/json",
        },
      });
      
      const data = await response.json();
      console.log({ response, data });

      if (response.ok && data.message === "success!") {
        setMessage(`User ${trimmedUsername} is registered successfully. Redirecting...`);
        setTimeout(() => {
          router.push("/auth/login");
        }, 1800);
      } else {
        setMessage(data?.message || "Registration failed. Please try again.");
        setIsRegistering(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("An error occurred during registration. Please try again.");
      setIsRegistering(false);
    }
  };
  return (
    <div className="auth-container">
      <div className="auth-card auth-card--split">
        <div className="auth-visual">
          <div className="auth-visual__badge">
            <EpcLogo className="h-16 w-16 rounded-2xl" />
            <div>
              <p className="auth-visual__eyebrow">EPC-Stack</p>
              <h2 className="auth-visual__title">Register</h2>
            </div>
          </div>
          <div className="auth-visual__image-wrap">
            <Image
              src="/images/auth-portal.svg"
              alt="Portal illustration"
              width={520}
              height={360}
              priority
              className="auth-visual__image"
            />
          </div>
          <p className="auth-visual__caption">
            Create your account and unlock the full EPC procurement workspace.
          </p>
        </div>

        <div className="auth-form-panel">
          <div className="mb-6 flex flex-col items-center text-center">
            <EpcLogo className="mb-4 h-16 w-16 rounded-2xl" />
            <h1 className="text-2xl font-bold text-slate-800">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Join the EPC-Stack Intranet MM Portal
            </p>
          </div>

          {message && (
        <div className={`mx-auto w-96 mt-3 p-3 rounded ${
          message.includes("registered") 
            ? "bg-green-200 text-green-800" 
            : "bg-red-200 text-red-800"
        }`}>
          {message}
        </div>
      )}
          <form
            className="flex flex-col gap-2 mt-3 mx-auto w-full max-w-[360px]"
            onSubmit={handleSubmit}
          >
            <div className="flex justify-around mb-9 ">
          {" "}
          <label htmlFor="email" className="font-bold uppercase">
            {" "}
            E-Mail:{" "}
          </label>{" "}
          <input
            type="email"
            name="email"
            id="email"
            placeholder="ahmed@jalint.com.sa"
            className="auth-input"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

            <div className="flex justify-around mb-9 ">
              {" "}
              <label htmlFor="username" className="font-bold uppercase">
            {" "}
            Username:{" "}
          </label>{" "}
          <input
            type="text"
            name="username"
            id="username"
            placeholder="Ahmed Alzahrani"
            className="auth-input"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

            <div className="flex justify-around mb-9 ">
              {" "}
              <label htmlFor="role" className="font-bold uppercase">
            {" "}
            Role
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="project">Project</option>
            </select>
          </label>{" "}
        </div>

            <div className="flex justify-around mb-9">
              {" "}
              <label htmlFor="password" className="font-bold uppercase">
            {" "}
            Password{" "}
          </label>{" "}
          <input
            type="password"
            name="password"
            id="password"
            label="password"
            placeholder="****"
            className="auth-input"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
            <div className="flex flex-col gap-4 items-center mt-6">
              <button type="submit" disabled={isRegistering} className="auth-button">
                <FontAwesomeIcon icon={faUserPlus} className="text-lg" />
                {isRegistering ? "Registering..." : "Register"}
              </button>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 mb-3 font-medium">
                  Already registered? Please sign in
                </p>
                <div className="flex gap-3 items-center justify-center flex-wrap">
                  <Link href="/auth/login" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 transform hover:scale-105">
                    <FontAwesomeIcon icon={faSignInAlt} className="text-base" />
                    Sign In
                  </Link>
                  <Link href="/" className="bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 transform hover:scale-105">
                    <FontAwesomeIcon icon={faHome} className="text-base" />
                    Return to Home
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Registerpage;
