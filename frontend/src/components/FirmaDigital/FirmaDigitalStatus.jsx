// components/FirmaDigital/FirmaDigitalStatus.jsx
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Timeline, Alert, Spin } from 'antd';
import { 
    CheckCircleOutlined, 
    ClockCircleOutlined, 
    CloseCircleOutlined,
    FileTextOutlined,
    UserOutlined
} from '@ant-design/icons';

const FirmaDigitalStatus = ({ firmaId, solicitudId }) => {
    const [firmaData, setFirmaData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarEstadoFirma();
        const interval = setInterval(cargarEstadoFirma, 30000); // Actualizar cada 30 segundos
        return () => clearInterval(interval);
    }, [firmaId]);

    const cargarEstadoFirma = async () => {
        try {
            const response = await fetch(`/api/firma-digital/firmas/${firmaId}/estado`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                setFirmaData(result.data);
                setError(null);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Error cargando estado de firma');
        } finally {
            setLoading(false);
        }
    };

    const getEstadoConfig = (estado) => {
        const configs = {
            'pendiente': { color: 'default', text: 'Pendiente', icon: <ClockCircleOutlined /> },
            'enviado': { color: 'processing', text: 'Enviado', icon: <ClockCircleOutlined /> },
            'firmado_solicitante': { color: 'success', text: 'Solicitante Firmó', icon: <CheckCircleOutlined /> },
            'firmado_operador': { color: 'success', text: 'Operador Firmó', icon: <CheckCircleOutlined /> },
            'firmado_completo': { color: 'success', text: 'Completado', icon: <CheckCircleOutlined /> },
            'rechazado': { color: 'error', text: 'Rechazado', icon: <CloseCircleOutlined /> },
            'expirado': { color: 'warning', text: 'Expirado', icon: <CloseCircleOutlined /> },
            'error': { color: 'error', text: 'Error', icon: <CloseCircleOutlined /> }
        };
        return configs[estado] || configs.pendiente;
    };

    const renderTimeline = () => {
        if (!firmaData) return null;

        const items = [
            {
                color: 'green',
                dot: <CheckCircleOutlined />,
                children: (
                    <>
                        <p><strong>Proceso Iniciado</strong></p>
                        <p>{new Date(firmaData.firma.fecha_envio).toLocaleString()}</p>
                    </>
                )
            }
        ];

        if (firmaData.firma.fecha_firma_solicitante) {
            items.push({
                color: 'green',
                dot: <UserOutlined />,
                children: (
                    <>
                        <p><strong>Solicitante Firmó</strong></p>
                        <p>{new Date(firmaData.firma.fecha_firma_solicitante).toLocaleString()}</p>
                    </>
                )
            });
        }

        if (firmaData.firma.fecha_firma_operador) {
            items.push({
                color: 'green',
                dot: <UserOutlined />,
                children: (
                    <>
                        <p><strong>Operador Firmó</strong></p>
                        <p>{new Date(firmaData.firma.fecha_firma_operador).toLocaleString()}</p>
                    </>
                )
            });
        }

        if (firmaData.firma.fecha_firma_completa) {
            items.push({
                color: 'blue',
                dot: <CheckCircleOutlined />,
                children: (
                    <>
                        <p><strong>Firma Completa</strong></p>
                        <p>{new Date(firmaData.firma.fecha_firma_completa).toLocaleString()}</p>
                    </>
                )
            });
        }

        return <Timeline items={items} />;
    };

    if (loading) {
        return (
            <Card>
                <div className="text-center">
                    <Spin size="large" />
                    <p>Cargando estado de firma digital...</p>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
            />
        );
    }

    const estadoConfig = getEstadoConfig(firmaData.firma.estado);

    return (
        <Card 
            title={
                <div className="flex items-center justify-between">
                    <span>
                        <FileTextOutlined /> Estado de Firma Digital
                    </span>
                    <Badge {...estadoConfig} />
                </div>
            }
            extra={
                <Button onClick={cargarEstadoFirma}>
                    Actualizar
                </Button>
            }
        >
            <div className="space-y-4">
                {/* Información de estado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold">Información de Firma</h4>
                        <p><strong>Estado:</strong> {estadoConfig.text}</p>
                        <p><strong>Enviado:</strong> {new Date(firmaData.firma.fecha_envio).toLocaleString()}</p>
                        <p><strong>Expira:</strong> {new Date(firmaData.firma.fecha_expiracion).toLocaleString()}</p>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold">Enlaces de Firma</h4>
                        {firmaData.firma.url_firma_solicitante && (
                            <p>
                                <Button 
                                    type="link" 
                                    href={firmaData.firma.url_firma_solicitante}
                                    target="_blank"
                                >
                                    Firma Solicitante
                                </Button>
                            </p>
                        )}
                        {firmaData.firma.url_firma_operador && (
                            <p>
                                <Button 
                                    type="link" 
                                    href={firmaData.firma.url_firma_operador}
                                    target="_blank"
                                >
                                    Firma Operador
                                </Button>
                            </p>
                        )}
                    </div>
                </div>

                {/* Línea de tiempo */}
                <div>
                    <h4 className="font-semibold mb-4">Progreso de Firma</h4>
                    {renderTimeline()}
                </div>

                {/* Validación de integridad */}
                {firmaData.firma.integridad_valida !== null && (
                    <Alert
                        message="Validación de Integridad"
                        description={
                            firmaData.firma.integridad_valida 
                                ? "El documento firmado coincide con el original. Integridad verificada."
                                : "Advertencia: El documento firmado no coincide con el original."
                        }
                        type={firmaData.firma.integridad_valida ? "success" : "warning"}
                        showIcon
                    />
                )}

                {/* Acciones */}
                <div className="flex gap-2">
                    {firmaData.firma.estado === 'expirado' && (
                        <Button type="primary" onClick={() => reenviarSolicitud()}>
                            Reenviar Solicitud
                        </Button>
                    )}
                    
                    <Button 
                        onClick={() => window.open(firmaData.firma.url_documento_firmado, '_blank')}
                        disabled={!firmaData.firma.url_documento_firmado}
                    >
                        Ver Documento Firmado
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default FirmaDigitalStatus;