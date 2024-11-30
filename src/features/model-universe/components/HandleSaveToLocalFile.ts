// src/features/featureA/components/HandleSaveToLocalFile.ts
import FileSaver from 'file-saver';

export const handleSaveToLocalFile = (data: any) => {
  console.log('handleSaveToLocalFile data:', data);
  if (data) {
    const fileName = data.name ? data.name : 'newModelfile';
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    FileSaver.saveAs(blob, fileName + '.json');
  } else {
    alert('No data available to save.');
  }
};