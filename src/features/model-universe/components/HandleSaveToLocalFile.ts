// src/features/featureA/components/HandleSaveToLocalFile.ts
import FileSaver from 'file-saver';
import { clearStore, clearModel, updateMetisInfo, updateModelInfo, updateProjectInfo, setSource } from '@/features/model-universe/modelSlice';

export const handleSaveToLocalFile = (data: any, dispatch?: any) => {
  console.log('handleSaveToLocalFile data:', data);

  // Safely check if domain exists
  if (!data || !data.phData) {
    alert('No data available to save. Type in a name in the Universe field at the top-left of the page, and try again');
    return;
  }

  let shortName = '';

  // Fix the logic for getting shortName from domain
  if (data.phSource) {
    shortName = data.phSource.includes("-")
      ? data.phSource.split("-")[0].trim()
      : data.phSource;
  } else if (data.phData.domain?.name) {
    dispatch(setSource(e.target.value))
  } else {
    alert('No domain name available to save. Type in a name in the Universe field at the top-left of the page, and try again.');
    return;
  }

  // Use shortName if available, otherwise default filename
  const fileName = shortName || 'newModelfile';

  // Add timestamp to filename to prevent overwrites
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFileName = `${fileName}-${timestamp}.json`;

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  FileSaver.saveAs(blob, finalFileName);
};