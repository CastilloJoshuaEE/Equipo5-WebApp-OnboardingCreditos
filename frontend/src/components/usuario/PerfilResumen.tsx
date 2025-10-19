import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar
} from '@mui/material';
import { 
  Person, 
  Business, 
  Email, 
  Phone 
} from '@mui/icons-material';
import { PerfilCompleto } from '@/types/usuario.types';
import { esPerfilSolicitante } from '@/utils/perfil.utils';

interface PerfilResumenProps {
  perfil: PerfilCompleto | null;
  onClick?: () => void;
}

const PerfilResumen: React.FC<PerfilResumenProps> = ({ perfil, onClick }) => {
  if (!perfil) return null;

  return (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick ? { 
          boxShadow: 6,
          transform: 'translateY(-2px)'
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h6" component="div">
              {perfil.nombre_completo}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {perfil.email}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip 
            label={perfil.rol} 
            color={perfil.rol === 'operador' ? 'primary' : 'secondary'}
            size="small"
          />
          <Chip 
            label={perfil.cuenta_activa ? 'Activo' : 'Inactivo'} 
            color={perfil.cuenta_activa ? 'success' : 'error'}
            size="small"
            sx={{ ml: 1 }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {perfil.telefono && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">{perfil.telefono}</Typography>
            </Box>
          )}

          {esPerfilSolicitante(perfil) && perfil.solicitantes && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                {perfil.solicitantes.nombre_empresa}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PerfilResumen;