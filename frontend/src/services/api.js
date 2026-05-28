import axios from "axios";

const BASE = "http://127.0.0.1:8000/api/v1";

// ---------------- AUTH ----------------
export const signupUser = async (data) => {
  const res = await axios.post(`${BASE}/signup`, data);
  return res.data;
};

export const loginUser = async (data) => {
  const res = await axios.post(`${BASE}/login`, data);
  return res.data;
};

// ---------------- PREDICT (Manual Input) ----------------
export const predictCloudburst = async (data) => {
  const token = localStorage.getItem("cloudburst_token");

  const res = await axios.post(`${BASE}/predict`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

// ---------------- LIVE SENSOR PREDICTION ----------------
export const getLiveSensorPrediction = async () => {
  const token = localStorage.getItem("cloudburst_token");

  const res = await axios.get(`${BASE}/predict`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

// ---------------- HISTORY ----------------
export const fetchHistory = async () => {
  const token = localStorage.getItem("cloudburst_token");

  if (!token) {
    console.warn("User not logged in");
    return;
  }

  const res = await axios.get(`${BASE}/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

// ---------------- ADMIN ----------------
export const fetchAllUsers = async () => {
  const token = localStorage.getItem("cloudburst_token");

  const res = await axios.get(`${BASE}/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

export const fetchAllLogs = async () => {
  const token = localStorage.getItem("cloudburst_token");

  const res = await axios.get(`${BASE}/admin/logs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

export const sendAdminSMS = async (message) => {
  const token = localStorage.getItem("cloudburst_token");

  const res = await axios.post(
    `${BASE}/admin/send-sms`,
    { message },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};

export const sendAdminEmail = async (message) => {
  const token = localStorage.getItem("cloudburst_token");

  const res = await axios.post(
    `${BASE}/admin/send-email`,
    { message },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};