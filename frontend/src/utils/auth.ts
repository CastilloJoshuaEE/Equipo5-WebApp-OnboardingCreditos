// frontend/src/utils/auth.ts
export class TokenManager {
    static getToken(): string | null {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            
            // Validar formato básico
            const parts = token.split('.');
            if (parts.length !== 3) {
                this.clearTokens();
                return null;
            }
            
            return token;
        } catch (error) {
            console.error('Error obteniendo token:', error);
            this.clearTokens();
            return null;
        }
    }

    static clearTokens(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
    }

    static async refreshToken(): Promise<string | null> {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) return null;

            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken })
            });

            if (response.ok) {
                const { data } = await response.json();
                localStorage.setItem('token', data.access_token);
                return data.access_token;
            }
        } catch (error) {
            console.error('Error refrescando token:', error);
        }
        
        this.clearTokens();
        return null;
    }

    static isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    }
}