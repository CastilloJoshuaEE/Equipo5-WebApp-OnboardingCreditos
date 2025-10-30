'use client';
import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  DesktopWindows,
  Person,
  Dashboard,
  Notifications,
  Description,
} from '@mui/icons-material';

interface DynamicNavigationProps {
  onNavigate?: () => void;
  navigationHandler?: (path: string) => void; // nuevo: función que maneja navegación con overlay
}

export const DynamicNavigation: React.FC<DynamicNavigationProps> = ({ onNavigate, navigationHandler }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname() ?? '';

  const handleNavigation = (path: string) => {
    if (navigationHandler) {
      navigationHandler(path);
    } else {
      router.push(path);
      if (onNavigate) onNavigate();
    }
    if (onNavigate) onNavigate();
  };

  const isActive = (path: string) => pathname === path;

  if (!session) return null;

  const shouldShowDocumentAccess = () => {
    if (session.user?.rol === 'operador') return true;
    return true;
  };

  return (
    <List sx={{ width: '100%' }}>
      {session.user?.rol === 'operador' && (
        <>
          <ListItem sx={{ mb: 1, borderRadius: 1 }}>
            <ListItemButton
              onClick={() => handleNavigation('/operador')}
              selected={isActive('/operador')}
              sx={{
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': { backgroundColor: 'primary.light' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <DesktopWindows />
              </ListItemIcon>
              <ListItemText
                primary="Panel Operador"
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: isActive('/operador') ? '600' : '400',
                }}
              />
            </ListItemButton>
          </ListItem>

          {shouldShowDocumentAccess() && (
            <ListItem sx={{ mb: 1, borderRadius: 1 }}>
              <ListItemButton
                onClick={() => handleNavigation('/documentos')}
                selected={isActive('/documentos') || pathname.startsWith('/solicitudes/')}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': { backgroundColor: 'primary.light' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Description />
                </ListItemIcon>
                <ListItemText
                  primary="Gestión Documentos"
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive('/documentos') ? '600' : '400',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}
        </>
      )}

      {session.user?.rol === 'solicitante' && (
        <>
          <ListItem sx={{ mb: 1, borderRadius: 1 }}>
            <ListItemButton
              onClick={() => handleNavigation('/solicitante')}
              selected={isActive('/solicitante')}
              sx={{
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': { backgroundColor: 'primary.light' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Dashboard />
              </ListItemIcon>
              <ListItemText
                primary="Mis Solicitudes"
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: isActive('/solicitante') ? '600' : '400',
                }}
              />
            </ListItemButton>
          </ListItem>

          {shouldShowDocumentAccess() && (
            <ListItem sx={{ mb: 1, borderRadius: 1 }}>
              <ListItemButton
                onClick={() => handleNavigation('/mis-documentos')}
                selected={isActive('/mis-documentos') || pathname.startsWith('/solicitudes/')}
                sx={{
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': { backgroundColor: 'primary.light' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Description />
                </ListItemIcon>
                <ListItemText
                  primary="Mis Documentos"
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive('/mis-documentos') ? '600' : '400',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}
        </>
      )}

      <ListItem sx={{ mb: 1, borderRadius: 1 }}>
        <ListItemButton
          onClick={() => handleNavigation('/usuario/perfil')}
          selected={isActive('/usuario/perfil')}
          sx={{
            borderRadius: 1,
            '&.Mui-selected': {
              backgroundColor: 'primary.light',
              '&:hover': { backgroundColor: 'primary.light' },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Person />
          </ListItemIcon>
          <ListItemText
            primary="Mi Perfil"
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: isActive('/usuario/perfil') ? '600' : '400',
            }}
          />
        </ListItemButton>
      </ListItem>

      <ListItem sx={{ mb: 1, borderRadius: 1 }}>
        <ListItemButton
          onClick={() => handleNavigation('/notificaciones')}
          selected={isActive('/notificaciones')}
          sx={{
            borderRadius: 1,
            '&.Mui-selected': {
              backgroundColor: 'primary.light',
              '&:hover': { backgroundColor: 'primary.light' },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Notifications />
          </ListItemIcon>
          <ListItemText
            primary="Notificaciones"
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: isActive('/notificaciones') ? '600' : '400',
            }}
          />
        </ListItemButton>
      </ListItem>
    </List>
  );
};
