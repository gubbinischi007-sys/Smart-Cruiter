import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  name: string | null;
  role: 'hr' | 'applicant' | null;
  roleTitle?: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: User;
  login: (role: 'hr' | 'applicant', email?: string, name?: string, roleTitle?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    // Check localStorage for existing session
    const savedRole = localStorage.getItem('userRole');
    const savedEmail = localStorage.getItem('userEmail');
    const savedName = localStorage.getItem('userName');
    const savedRoleTitle = localStorage.getItem('userRoleTitle');
    return {
      name: savedName,
      role: savedRole as 'hr' | 'applicant' | null,
      roleTitle: savedRoleTitle,
      email: savedEmail,
      isAuthenticated: !!savedRole
    };
  });

  const login = (role: 'hr' | 'applicant', emailInput?: string, nameInput?: string, roleTitleInput?: string) => {
    // Generate a temporary ID for the user
    // Use the provided email or fallback to defaults
    const email = emailInput || (role === 'hr' ? 'recruiter@company.com' : 'candidate@user.com');
    const name = nameInput || (role === 'hr' ? 'HR Manager' : 'Job Applicant');
    const timestamp = new Date().toISOString();

    // Save to history using only localStorage as a simple 'backend' for now
    if (role === 'hr') {
      const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
      history.push({
        id: crypto.randomUUID(),
        email: email,
        name: name,
        loginTime: timestamp,
        logoutTime: null,
        role: role
      });
      localStorage.setItem('loginHistory', JSON.stringify(history));
    }

    const newUser: User = { name, role, email, roleTitle: roleTitleInput, isAuthenticated: true };
    setUser(newUser);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', name);
    if (roleTitleInput) localStorage.setItem('userRoleTitle', roleTitleInput);
    // Needed to link logout with this session later
    localStorage.setItem('lastLoginTime', timestamp);
  };

  const logout = () => {
    // Update history with logout time
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    if (lastLoginTime) {
      const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
      // Find the record for this session (simplify: find last open session)
      const lastSessionIndex = history.findIndex((h: any) => h.loginTime === lastLoginTime && h.logoutTime === null);
      if (lastSessionIndex !== -1) {
        history[lastSessionIndex].logoutTime = new Date().toISOString();
        localStorage.setItem('loginHistory', JSON.stringify(history));
      }
      localStorage.removeItem('lastLoginTime');
    }

    const newUser: User = { name: null, role: null, email: null, isAuthenticated: false };
    setUser(newUser);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRoleTitle');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
