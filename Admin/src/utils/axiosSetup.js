import axios from "axios";

// Attach the admin token to every request, so calls work right after login
// (the static `config` objects are built once, when the app first loads)
axios.interceptors.request.use((req) => {
  const user = localStorage.getItem("user");
  if (user) {
    const { token } = JSON.parse(user);
    if (token) req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.replace("/");
    }
    return Promise.reject(error);
  }
);
