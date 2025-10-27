import React, { useState, useRef, useCallback } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tabs,
    Tab,
    Paper,
    Typography,
    Grid,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton
} from '@mui/material';
import {
    Close,
    Undo,
    Redo,
    Save,
    Clear,
    FormatColorText,
    Brush,
    Image
} from '@mui/icons-material';

interface EditorFirmaProps {
    open: boolean;
    onClose: () => void;
    onFirmaGuardada: (firmaData: any) => void;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`firma-tabpanel-${index}`}
            aria-labelledby={`firma-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
};

const EditorFirma: React.FC<EditorFirmaProps> = ({ open, onClose, onFirmaGuardada }) => {
    const [tabValue, setTabValue] = useState(0);
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [iniciales, setIniciales] = useState('');
    const [estiloFirma, setEstiloFirma] = useState('cursiva');
    const [grosorPincel, setGrosorPincel] = useState(3);
    const [colorFirma, setColorFirma] = useState('#000000');
    const [firmaDibujada, setFirmaDibujada] = useState<string>('');
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Funciones para dibujar firma
    const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);

        // Guardar estado inicial
        if (historyStep < history.length - 1) {
            setHistory(history.slice(0, historyStep + 1));
        }
        setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        setHistoryStep(prev => prev + 1);
    }, [history, historyStep]);

    const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    }, [isDrawing]);

    const stopDrawing = useCallback(() => {
        setIsDrawing(false);
    }, []);

    const limpiarCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHistory([]);
        setHistoryStep(-1);
    }, []);

    const deshacer = useCallback(() => {
        if (historyStep > 0) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.putImageData(history[historyStep - 1], 0, 0);
            setHistoryStep(prev => prev - 1);
        }
    }, [history, historyStep]);

    const rehacer = useCallback(() => {
        if (historyStep < history.length - 1) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.putImageData(history[historyStep + 1], 0, 0);
            setHistoryStep(prev => prev + 1);
        }
    }, [history, historyStep]);

    const guardarFirmaDibujada = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setFirmaDibujada(canvas.toDataURL());
    }, []);

    const handleGuardarFirma = () => {
        let firmaData: any = {
            tipoFirma: tabValue === 0 ? 'texto' : tabValue === 1 ? 'dibujo' : 'imagen',
            fechaCreacion: new Date().toISOString()
        };

        if (tabValue === 0) {
            firmaData.firmaTexto = nombreCompleto;
            firmaData.iniciales = iniciales;
            firmaData.estilo = estiloFirma;
        } else if (tabValue === 1) {
            firmaData.firmaImagen = firmaDibujada;
            firmaData.grosorPincel = grosorPincel;
            firmaData.colorFirma = colorFirma;
        }

        onFirmaGuardada(firmaData);
        onClose();
        
        // Resetear formulario
        setNombreCompleto('');
        setIniciales('');
        setFirmaDibujada('');
        limpiarCanvas();
    };

    // Inicializar canvas
    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = colorFirma;
        ctx.lineWidth = grosorPincel;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, [colorFirma, grosorPincel]);

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: { height: '80vh' }
            }}
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Crear Firma Digital</Typography>
                    <IconButton onClick={onClose}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Tabs value={tabValue} onChange={handleTabChange} centered>
                    <Tab icon={<FormatColorText />} label="Texto" />
                    <Tab icon={<Brush />} label="Dibujar" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
<Grid size={{ xs: 12}}>                            
    <TextField
                                fullWidth
                                label="Nombre Completo"
                                value={nombreCompleto}
                                onChange={(e) => setNombreCompleto(e.target.value)}
                                placeholder="Ingrese su nombre completo para la firma"
                            />
                        </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Iniciales"
                                value={iniciales}
                                onChange={(e) => setIniciales(e.target.value)}
                                placeholder="Ej: JPG"
                            />
                        </Grid>
<Grid size={{ xs: 12, md: 6}}>
                                <FormControl fullWidth>
                                <InputLabel>Estilo de Firma</InputLabel>
                                <Select
                                    value={estiloFirma}
                                    onChange={(e) => setEstiloFirma(e.target.value)}
                                    label="Estilo de Firma"
                                >
                                    <MenuItem value="normal">Normal</MenuItem>
                                    <MenuItem value="cursiva">Cursiva</MenuItem>
                                    <MenuItem value="negrita">Negrita</MenuItem>
                                    <MenuItem value="elegante">Elegante</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
<Grid size={{ xs: 12}}>
                                <Paper 
                                variant="outlined" 
                                sx={{ 
                                    p: 3, 
                                    textAlign: 'center',
                                    fontFamily: estiloFirma === 'cursiva' ? 'cursive' : 'inherit',
                                    fontWeight: estiloFirma === 'negrita' ? 'bold' : 'normal',
                                    fontSize: '1.5rem'
                                }}
                            >
                                {nombreCompleto || 'Vista previa de la firma'}
                                <br />
                                {iniciales && `(${iniciales})`}
                            </Paper>
                        </Grid>
                    </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12}}>
                            <Box display="flex" gap={2} alignItems="center" mb={2}>
                                <Typography variant="body2">Grosor:</Typography>
                                <Slider
                                    value={grosorPincel}
                                    onChange={(e, newValue) => setGrosorPincel(newValue as number)}
                                    min={1}
                                    max={10}
                                    sx={{ width: 100 }}
                                />
                                <Typography variant="body2">Color:</Typography>
                                <input
                                    type="color"
                                    value={colorFirma}
                                    onChange={(e) => setColorFirma(e.target.value)}
                                    style={{ width: 40, height: 40 }}
                                />
                            </Box>
                        </Grid>
                       <Grid size={{ xs: 12}}>
                            <Box display="flex" gap={1} mb={2}>
                                <Button 
                                    startIcon={<Undo />} 
                                    onClick={deshacer}
                                    disabled={historyStep <= 0}
                                >
                                    Deshacer
                                </Button>
                                <Button 
                                    startIcon={<Redo />} 
                                    onClick={rehacer}
                                    disabled={historyStep >= history.length - 1}
                                >
                                    Rehacer
                                </Button>
                                <Button 
                                    startIcon={<Clear />} 
                                    onClick={limpiarCanvas}
                                    color="error"
                                >
                                    Limpiar
                                </Button>
                                <Button 
                                    startIcon={<Save />} 
                                    onClick={guardarFirmaDibujada}
                                    variant="contained"
                                >
                                    Guardar Firma
                                </Button>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12}}>
                            <Paper 
                                variant="outlined" 
                                sx={{ 
                                    height: 200, 
                                    position: 'relative',
                                    cursor: 'crosshair'
                                }}
                            >
                                <canvas
                                    ref={canvasRef}
                                    width={600}
                                    height={200}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: '1px solid #ccc'
                                    }}
                                />
                            </Paper>
                        </Grid>
                        {firmaDibujada && (
                            <Grid size={{ xs: 12}}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Vista previa de firma guardada:
                                </Typography>
                                <img 
                                    src={firmaDibujada} 
                                    alt="Firma dibujada" 
                                    style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: 100,
                                        border: '1px solid #ccc'
                                    }} 
                                />
                            </Grid>
                        )}
                    </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <Box textAlign="center" py={3}>
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="firma-image-upload"
                        />
                        <label htmlFor="firma-image-upload">
                            <Button 
                                variant="contained" 
                                component="span"
                                startIcon={<Image />}
                            >
                                Seleccionar Imagen de Firma
                            </Button>
                        </label>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 2MB
                        </Typography>
                    </Box>
                </TabPanel>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button 
                    onClick={handleGuardarFirma}
                    variant="contained"
                    disabled={
                        (tabValue === 0 && !nombreCompleto) ||
                        (tabValue === 1 && !firmaDibujada)
                    }
                >
                    Guardar Firma
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditorFirma;