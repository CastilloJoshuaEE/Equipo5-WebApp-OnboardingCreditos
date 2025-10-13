'use client';
import React, {useState} from 'react';
import{
    Card,
    CardContent,
    TextField,
    Button,
    Alert,
    Typography,
    Box
} from '@mui/material'
export default function EmailRecuperacionForm(){
    const[emailRecuperacion, setEmailRecuperacion]= useState('');
    const[loading, setLoading]=useState(false);
    const[message, setMessage]= useState('');
    const [error, setError]= useState('');
    const handleSubmit=async(e:React.FormEvent)=>{
        e.preventDefault();
        if(!emailRecuperacion){
            setError('El email de recuperación es requerido');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');
        try{
            const response= await fetch('/api/usuario/email-recuperacion',{
                method:'PUT',
                headers:{
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({email_recuperacion:emailRecuperacion}),
            });
            const data= await response.json();
            if(data.sucess){
                setMessage('Email de recuperación actualizado exitosamente');
                setEmailRecuperacion('');
            }else{
                setError(data.message|| 'Error al actualizar el email de recuperación');
            }
        }catch(error){
            setError('Error de conexión');
        }finally{
            setLoading(false);
        }
    };
    return(
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom> 
                    Email de recuperación
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Establece un email alternativo para recuperar tu cuenta en caso de perder el acceso.
                </Typography>
                {message &&(
                    <Alert severity="success" sx={{mb:2}}>
                        {message}
                    </Alert>
                )}
                {error &&(
                    <Alert severity="error" sx={{mb:2}}>
                        {error}
                    </Alert>
                )}
                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        label="Email de recuperación"
                        type="email"
                        fullWidth
                        value={emailRecuperacion}
                        onChange={(e)=>setEmailRecuperacion(e.target.value)}
                        margin="normal"
                        placeholder="ejemplo@email.com"
                        helperText="Este email se usará para recuperar tu cuenta si pierdes el acceso"
                    />
                    <Button type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{mt:2}}
                    >
                        {loading? 'Actualizando...': 'Guardar email de recuperación'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    )
}