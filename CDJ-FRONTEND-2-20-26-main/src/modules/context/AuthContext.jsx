import { createContext, useState, useContext, useEffect } from "react";
import PropTypes from 'prop-types'; 
import {http} from '../../api/http';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [updatePassMessage, setUpdatePassMessage] = useState(null);
  const [error, setError] = useState('');
  const [loadingBtn, setLoadingBtn] = useState(false);

  // ============ CLIENTS STATE ============
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsSummary, setClientsSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    soleProprietor: 0,
    corporation: 0,
    coop: 0,
    others: 0
  });

  // ============ SERVICES STATE ============
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // ── Helper: clear all auth state + localStorage ──────────
  const clearSession = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userFullName');
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // ── Helper: extract FullName from decoded JWT ─────────────
  const extractFullName = (decoded) => {
    return (
      decoded?.Fname     ||
      decoded?.FullName  ||
      decoded?.fullName  ||
      decoded?.full_name ||
      decoded?.name      ||
      null
    );
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        setAccessToken(decoded);
        setIsAuthenticated(true);
        checkTokenExpiration(decoded);

        const fullName = extractFullName(decoded);
        if (fullName) {
          localStorage.setItem('userFullName', fullName);
        }
      } catch {
        clearSession();
      }
    }
  }, []);

  useEffect(() => { 
    let interval;
    if (accessToken) {
      interval = setInterval(() => {
        checkTokenExpiration(accessToken);
      }, 1000); 
    }
    return () => clearInterval(interval);
  }, [accessToken]);

  const checkTokenExpiration = (token) => {
    const currentTime = Date.now() / 1000;
    if (token.exp < currentTime) {
      tokenexpirationLogout(); 
    }
  };

  const login = async (username, password) => {
    setLoadingBtn(true);
    try {
      const response = await http.post('/login', { username, password });
      const decoded = jwtDecode(response.data.accessToken);
      localStorage.setItem('accessToken', response.data.accessToken);

      const fullName = extractFullName(decoded);
      if (fullName) {
        localStorage.setItem('userFullName', fullName);
      }

      setAccessToken(decoded);
      setIsAuthenticated(true);    
      checkTokenExpiration(decoded);
    } catch (error) {
      if (!error.response) {
        // Network down / server unreachable
        setError("Cannot connect to server. Please check your connection or try again later.");
      } else {
        const msg = error.response?.data?.error;
        if (msg === "Invalid username or password") {
          setError("Invalid username or password.");
        } else if (msg === "Invalid password!") {
          setError("Invalid password!");
        } else {
          setError("Server Error");
        }
      }
    } finally {
      setLoadingBtn(false);
    }
  };

  // ── Logout: always clears local state even if API is down ──
  const logout = async () => {
    try {
      const response = await http.delete('/logout');
      if (response.status === 204) {
        clearSession();
        setError("Logout successful");
      } else {
        setError("Logout failed. Please try again.");
      }
    } catch (error) {
      console.warn("Logout API call failed, clearing session anyway:", error.message);
      clearSession();
    }
  };

  const passwordChanged = async () => {
    try {
      const response = await http.delete('/logout');
      if (response.status === 200) {
        clearSession();
        setError("Password has been changed.");
      } else {
        setError("Logout failed. Please try again.");
      }
    } catch (error) {
      console.warn("passwordChanged API call failed, clearing session anyway:", error.message);
      clearSession();
    }
  };

  const userUpdatePassword = async (OTP, password) => {
    await http.get(`/update-password?OTP=${OTP}&newPassword=${password}`);
    setUpdatePassMessage('Password updated, please login your new password.');   
  };

  const tokenexpirationLogout = async () => {
    try {
      await http.delete('/logout');
    } catch {
      // Ignore — token already expired, just clean up
    } finally {
      clearSession();
      setError("Session expired. For security, inactive accounts auto-logout after 1 day. Please log in again. Thank you.");
    }
  };

  const idleLogout = async () => {
    try {
      await http.delete('/logout');
    } catch {
      // Ignore — clean up regardless
    } finally {
      clearSession();
      setError("Your session has expired due to 15 minutes of inactivity; you have been automatically logged out.");
    }
  };

  // ============ CLIENTS CRUD FUNCTIONS ============

  const getClientsSummary = async () => {
    setClientsLoading(true);
    try {
      const response = await http.get('/clients-summary');
      if (response.data.success) {
        setClientsSummary(response.data.data);
      }
      return response.data;
    } catch (error) {
      console.error("Fetch clients summary error:", error);
      setError("Failed to fetch clients summary");
      throw error;
    } finally {
      setClientsLoading(false);
    }
  };

  const getClients = async () => {
    setClientsLoading(true);
    try {
      const response = await http.get('/clients');
      if (response.data.success) {
        setClients(response.data.data);
      }
      return response.data;
    } catch (error) {
      console.error("Fetch clients error:", error);
      setError("Failed to fetch clients");
      throw error;
    } finally {
      setClientsLoading(false);
    }
  };

  const createClient = async (clientData) => {
    setClientsLoading(true);
    try {
      const response = await http.post('/clients', clientData);
      await getClients();
      await getClientsSummary();
      return response.data;
    } catch (error) {
      console.error("Create client error:", error);
      setError("Failed to create client");
      throw error;
    } finally {
      setClientsLoading(false);
    }
  };

  const updateClient = async (id, clientData) => {
    setClientsLoading(true);
    try {
      const response = await http.put('/clients', { id, ...clientData });
      await getClients();
      await getClientsSummary();
      return response.data;
    } catch (error) {
      console.error("Update client error:", error);
      setError("Failed to update client");
      throw error;
    } finally {
      setClientsLoading(false);
    }
  };

  const deleteClient = async (id) => {
    setClientsLoading(true);
    try {
      const response = await http.delete(`/clients?id=${id}`);
      await getClients();
      await getClientsSummary();
      return response.data;
    } catch (error) {
      console.error("Delete client error:", error);
      setError("Failed to delete client");
      throw error;
    } finally {
      setClientsLoading(false);
    }
  };

  const getClientById = async (id) => {
    setClientsLoading(true);
    try {
      const response = await http.get(`/client?id=${id}`);
      return response.data;
    } catch (error) {
      console.error("Fetch client error:", error);
      setError("Failed to fetch client");
      throw error;
    } finally {
      setClientsLoading(false);
    }
  };

  const getExpiringTaxClearances = async (days = 30) => {
    try {
      const response = await http.get(`/clients-expiring-clearances?days=${days}`);
      return response.data;
    } catch (error) {
      console.error("Fetch expiring clearances error:", error);
      throw error;
    }
  };

  // ============ SERVICES CRUD FUNCTIONS ============

  const getServices = async () => {
    setServicesLoading(true);
    try {
      const response = await http.get('/students');
      setServices(response.data.data);
      return response.data;
    } catch (error) {
      console.error("Fetch services error:", error);
      setError("Failed to fetch services");
      throw error;
    } finally {
      setServicesLoading(false);
    }
  };

  const createService = async (servicesId, particulars, price) => {
    setServicesLoading(true);
    try {
      const response = await http.post('/students', {
        firstname: servicesId,
        lastname: particulars,
        school: price
      });
      await getServices();
      return response.data;
    } catch (error) {
      console.error("Create service error:", error);
      setError("Failed to create service");
      throw error;
    } finally {
      setServicesLoading(false);
    }
  };

  const updateService = async (id, servicesId, particulars, price) => {
    setServicesLoading(true);
    try {
      const response = await http.put('/students', {
        id,
        firstname: servicesId,
        lastname: particulars,
        school: price
      });
      await getServices();
      return response.data;
    } catch (error) {
      console.error("Update service error:", error);
      setError("Failed to update service");
      throw error;
    } finally {
      setServicesLoading(false);
    }
  };

  const deleteService = async (id) => {
    setServicesLoading(true);
    try {
      const response = await http.delete(`/students?id=${id}`);
      await getServices();
      return response.data;
    } catch (error) {
      console.error("Delete service error:", error);
      setError("Failed to delete service");
      throw error;
    } finally {
      setServicesLoading(false);
    }
  };

  const value = {
    // Auth
    isAuthenticated,
    user,
    accessToken,
    login,
    logout,
    idleLogout,
    userUpdatePassword,
    updatePassMessage,
    error,
    loadingBtn,
    passwordChanged,
    
    // Clients
    clients,
    clientsLoading,
    clientsSummary,
    getClients,
    getClientsSummary,
    createClient,
    updateClient,
    deleteClient,
    getClientById,
    getExpiringTaxClearances,
    
    // Services
    services,
    servicesLoading,
    getServices,
    createService,
    updateService,
    deleteService
  };
    
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => {
  return useContext(AuthContext);
};