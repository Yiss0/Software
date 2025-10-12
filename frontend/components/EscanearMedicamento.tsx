import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, Flashlight, FlashlightOff, Scan, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onMedicamentoEscaneado: (codigo: string) => void;
}

const { width, height } = Dimensions.get('window');

export default function EscanearMedicamento({ visible, onClose, onMedicamentoEscaneado }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!scanned) {
      setScanned(true);
      
      // Simular búsqueda de medicamento por código de barras
      const medicamentosDB: { [key: string]: any } = {
        '8470001234567': {
          nombre: 'Aspirina',
          dosis: '100mg',
          laboratorio: 'Bayer'
        },
        '8470007654321': {
          nombre: 'Paracetamol',
          dosis: '500mg',
          laboratorio: 'Cinfa'
        }
      };

      const medicamento = medicamentosDB[data];
      
      if (medicamento) {
        Alert.alert(
          'Medicamento encontrado',
          `${medicamento.nombre} ${medicamento.dosis}\nLaboratorio: ${medicamento.laboratorio}`,
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => {
                setScanned(false);
              }
            },
            {
              text: 'Agregar',
              onPress: () => {
                onMedicamentoEscaneado(data);
                onClose();
                setScanned(false);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Medicamento no encontrado',
          'No se encontró información para este código. ¿Desea agregarlo manualmente?',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => {
                setScanned(false);
              }
            },
            {
              text: 'Agregar manualmente',
              onPress: () => {
                onClose();
                setScanned(false);
              }
            }
          ]
        );
      }
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#6B7280" strokeWidth={2} />
          <Text style={styles.permissionTitle}>Permiso de cámara requerido</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a la cámara para escanear códigos de barras de medicamentos
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Conceder permiso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'code128', 'code39'],
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={28} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Escanear Medicamento</Text>
            <TouchableOpacity 
              style={styles.flashButton} 
              onPress={() => setFlashOn(!flashOn)}
            >
              {flashOn ? (
                <FlashlightOff size={28} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <Flashlight size={28} color="#FFFFFF" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>

          {/* Área de escaneo */}
          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>

          {/* Instrucciones */}
          <View style={styles.instructions}>
            <Scan size={32} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.instructionText}>
              Apunte la cámara hacia el código de barras del medicamento
            </Text>
            <Text style={styles.instructionSubtext}>
              Mantenga el código dentro del marco
            </Text>
          </View>

          {/* Botón manual */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.manualButton} onPress={onClose}>
              <Text style={styles.manualButtonText}>Agregar manualmente</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: width * 0.8,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  instructionSubtext: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  manualButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  manualButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});