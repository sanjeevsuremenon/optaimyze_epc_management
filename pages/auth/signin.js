import React, { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import EpcLogo from "../../components/EpcLogo";

function Login() {
  const [userinfo, setUserinfo] = useState({
    email: "",
    name: "",
    password: "",
  });

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signIn("credentials", {
      email: userinfo.email,
      name: userinfo.name,
      password: userinfo.password,
    });

    router.push("/");
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card--split">
        <div className="auth-visual">
          <div className="auth-visual__badge">
            <EpcLogo className="h-16 w-16 rounded-2xl" />
            <div>
              <p className="auth-visual__eyebrow">EPC-Stack</p>
              <h2 className="auth-visual__title">MM Portal</h2>
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
            Monitor procurement, vendor collaboration, and project visibility in one place.
          </p>
        </div>

        <div className="auth-form-panel">
          <div className="flex flex-col items-center mb-6 text-center">
            <EpcLogo className="mb-4 h-16 w-16 rounded-2xl" />
            <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Sign in to continue to the EPC portal</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              name="email"
              value={userinfo.email}
              onChange={(e) => setUserinfo({ ...userinfo, email: e.target.value })}
              placeholder="sure.n@jalint.com.sa"
              className="auth-input"
            />
            <input
              type="text"
              name="name"
              value={userinfo.name}
              placeholder="sureshnaloor"
              onChange={(e) => setUserinfo({ ...userinfo, name: e.target.value })}
              className="auth-input"
            />
            <input
              type="password"
              name="password"
              value={userinfo.password}
              placeholder="********"
              onChange={(e) => setUserinfo({ ...userinfo, password: e.target.value })}
              className="auth-input"
            />
            <button type="submit" className="auth-button">Sign in</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
