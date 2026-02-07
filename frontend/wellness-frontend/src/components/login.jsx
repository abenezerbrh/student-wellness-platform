import { useState } from "react";
import { supabase } from "../supabaseClient";
import "./login.css";
import { FcGoogle } from "react-icons/fc";
import { MdEmail, MdLock, MdPerson } from "react-icons/md";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) alert(error.message);
  };

  const signInWithEmail = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: firstName,
          },
        },
      });

      if (error) {
        alert(error.message);
      } else {
        alert("Check your email to confirm your account.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("confirm")) {
          alert("Please confirm your email before signing in.");
        } else {
          alert(error.message);
        }
      }
    }

    setLoading(false);
  };

  const continueAsGuest = () => {
    localStorage.setItem("guest", "true");
    localStorage.removeItem("session_id");
    window.location.reload();
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
        
          <h1>Welcome Back</h1>
          <p>Sign in to continue your wellness journey</p>
        </div>

        <div className="login-content">


          <div className="divider">
            <span>or continue with email</span>
          </div>

          <form onSubmit={signInWithEmail} className="login-form">
            {isSignUp && (
              <div className="input-group">
                <MdPerson className="input-icon" />
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="login-input"
                />
              </div>
            )}

            <div className="input-group">
              <MdEmail className="input-icon" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
              />
            </div>

            <div className="input-group">
              <MdLock className="input-icon" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <span className="loading-text">Please wait...</span>
              ) : (
                <span>{isSignUp ? "Create Account" : "Sign In"}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="btn-toggle"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <button onClick={signInWithGoogle} className="btn btn-google">
            <FcGoogle className="btn-icon" />
            <span>Continue with Google</span>
          </button>

          <button onClick={continueAsGuest} className="btn btn-guest">
            <span>Continue as Guest</span>
            <span className="guest-badge">No account needed</span>
          </button>
        </div>
      </div>
    </div>
  );
}