import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../lib/useTheme';
import { useEntryStore } from '../stores/entryStore';

export default function AttachmentGrid() {
  const { colors: t } = useTheme();
  const { attachments, addAttachment, removeAttachment } = useEntryStore();

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      addAttachment({
        id: Date.now().toString(),
        entryId: '',
        fileName: asset.fileName || 'photo.jpg',
        fileType: asset.mimeType || 'image/jpeg',
        uri: asset.uri,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      multiple: true,
    });
    if (!result.canceled && result.assets) {
      result.assets.forEach((asset) => {
        addAttachment({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          entryId: '',
          fileName: asset.name,
          fileType: asset.mimeType || 'application/octet-stream',
          uri: asset.uri,
          createdAt: new Date().toISOString(),
        });
      });
    }
  };

  const isImage = (type: string) => type.startsWith('image/');
  const getExt = (name: string) => name.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <View>
      <Text style={[styles.label, { color: t.textMuted }]}>ATTACHMENTS</Text>
      {attachments.length > 0 && (
        <View style={styles.grid}>
          {attachments.map((att) => (
            <View key={att.id} style={[styles.thumb, { borderColor: t.border, backgroundColor: t.surface2 }]}>
              {isImage(att.fileType) ? (
                <Image source={{ uri: att.uri }} style={styles.thumbImg} />
              ) : (
                <View style={styles.fileIcon}>
                  <Text style={styles.fileIconText}>📄</Text>
                  <Text style={[styles.fileExt, { color: t.textMuted }]}>{getExt(att.fileName)}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeAttachment(att.id)}>
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.attachBtn, { backgroundColor: t.surface, borderColor: t.border }]} onPress={takePhoto} activeOpacity={0.8}>
          <Text style={styles.attachIcon}>📷</Text>
          <Text style={[styles.attachText, { color: t.textMuted }]}>Take photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.attachBtn, { backgroundColor: t.surface, borderColor: t.border }]} onPress={pickFile} activeOpacity={0.8}>
          <Text style={styles.attachIcon}>📎</Text>
          <Text style={[styles.attachText, { color: t.textMuted }]}>Upload file</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, letterSpacing: 2, fontFamily: 'DMSans-Bold', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  thumb: { width: 76, height: 76, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  thumbImg: { width: '100%', height: '100%' },
  fileIcon: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  fileIconText: { fontSize: 20, opacity: 0.5 },
  fileExt: { fontSize: 10, fontFamily: 'DMSans-Bold', textTransform: 'uppercase' },
  removeBtn: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  removeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 10 },
  attachBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 16 },
  attachIcon: { fontSize: 18 },
  attachText: { fontSize: 14, fontFamily: 'DMSans-Medium' },
});
