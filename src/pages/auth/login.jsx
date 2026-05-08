import { useState } from "react";
import "../style/login.css";
import "../../constant/applicationStyle.css";
import { supabase } from "../../supabaseClient";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../component/button/button";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../store/Thunk/authThunk";

const Login = () => {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    try {
      const resultAction = await dispatch(login({ email, password }));
      // console.log("login", resultAction?.payload?.user?.user_metadata?.role);

      if (login.fulfilled.match(resultAction)) {
        setMessage("Login successful!");
        if (resultAction?.payload?.user?.user_metadata?.role == "Admin") {
          navigate("/admin/adminDashboard");
        } else {
          navigate("/dashboard");
        }
      } else if (login.rejected.match(resultAction)) {
        setMessage("Login failed: " + resultAction.payload);
      }
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
  //       options: {
  //         data: {
  //           role: role ? role : "",
  //         },
  //       },
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
      <div className="loginContainer">
        <h1 className="textStyle">Welcome Back!</h1>
        <div>
          <label className="labelStyle">Email</label>
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
              className="inputStyle pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-12 text-gray-500 py-0 px-0 bg-[transparent] "
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* <label>
            <input
              type="checkbox"
              className="mr-2 mb-4"
              value={role}
              name="role"
              onChange={(e) => setRole(e.target.checked ? "Admin" : "")}
            />
            login as Admin
          </label> */}
        </div>

        <Button 
          className="" 
          onClick={handleLogin} 
          loading={loading} 
          loadingText="Logging in..."
        >
          Login
        </Button>

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
