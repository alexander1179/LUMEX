import * as FileSystem from 'expo-file-system';

export async function fetchImageAsBase64(imageUrl) {
  try {
    const fileUri = FileSystem.cacheDirectory + 'temp_chart_img.png';
    const downloadResumable = FileSystem.createDownloadResumable(imageUrl, fileUri);
    const { uri } = await downloadResumable.downloadAsync();
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    return `data:image/png;base64,${base64}`;
  } catch (e) {
    return '';
  }
}
