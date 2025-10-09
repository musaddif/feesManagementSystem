import { useState } from "react";
import "./login.css";
import { supabase } from "../supabaseClient";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage("Login failed: " + error.message);
        return;
      }

      setMessage("Login successful!");
      navigate("/dashboard");

      // Optional: Fetch user profile from your custom `user` table
      // const { data: userProfile } = await supabase
      //   .from("user")
      //   .select("*")
      //   .eq("user_id", data.user.id)
      //   .single();

      // console.log("User profile:", userProfile);
    } catch (err) {
      setMessage("Unexpected error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // const handleSignUp = async () => {
  //   setLoading(true);
  //   setMessage("");

  //   try {
  //     // 1️⃣ Sign up with Supabase Auth
  //     const { data, error } = await supabase.auth.signUp({
  //       email,
  //       password,
  //     });

  //     if (error) {
  //       setMessage("Sign up failed: " + error.message);
  //       return;
  //     }

  //     const { user } = data;
  //     if (user) {
  //       await supabase.from("user").insert([
  //         {
  //           user_id: user.id, // Supabase Auth user ID
  //           userName: username, // Custom field
  //           email: user.email,
  //         },
  //       ]);
  //     }

  //     setMessage(
  //       "Signup successful! Please check your email to verify your account."
  //     );
  //   } catch (err) {
  //     setMessage("Unexpected error: " + err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="backgroundStyle">
      <div className="container">
        <h1 className="textStyle">Welcome Back!</h1>
        <div>
          <label className="labelStyle">email</label>
          <input
            type="email"
            className="inputStyle"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="relative w-full">
            <label className="labelStyle block mb-1">Password</label>

            <input
              type={showPassword ? "text" : "password"}
              className="inputStyle w-full pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-12 text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button className="loginbtn" onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* <button onClick={handleSignUp}>signUp</button> */}

        {message && (
          <p
            style={{
              marginTop: "20px",
              color: message.includes("successful") ? "green" : "red",
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
