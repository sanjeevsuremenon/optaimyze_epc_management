import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

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
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          value={userinfo.email}
          onChange={(e) => setUserinfo({ ...userinfo, email: e.target.value })}
          placeholder="sure.n@jalint.com.sa"
        />
        <input
          type="text"
          name="name"
          value={userinfo.name}
          placeholder="sureshnaloor"
          onChange={(e) => setUserinfo({ ...userinfo, name: e.target.value })}
        />
        <input
          type="password"
          name="password"
          value={userinfo.password}
          placeholder="********"
          onChange={(e) =>
            setUserinfo({ ...userinfo, password: e.target.value })
          }
        />
        <button type="submit">Signin</button>
      </form>
    </div>
  );
}

export default Login;
