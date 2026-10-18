import axios from "axios";

// Attach the customer token to every request, so calls work right after login
// (the static `config` objects are built once, when the app first loads)
axios.interceptors.request.use((req) => {
  const customer = localStorage.getItem("customer");
  if (customer) {
    const { token } = JSON.parse(customer);
    if (token) req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});
