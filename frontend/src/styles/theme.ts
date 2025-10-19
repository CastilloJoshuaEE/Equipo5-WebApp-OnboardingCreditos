 
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#C8A7E0', //  lavanda (botón)
      contrastText: '#fff',
    },
    background: {
      default: '#F6EDF4', // rosa muy claro (fondo general)
      paper: '#ffffff',
    },
    text: {
      primary: '#213126', //  verde oscuro del texto (revisar si dejar)
      secondary: '#6b6b6b',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h5: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.95rem',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          fontWeight: 600,
        },
        contained: {
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            borderRadius: 6,
          },
        },
      },
    },
  },
});

export default theme;

