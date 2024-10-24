// src/features/featureA/components/HandleSaveToLocalFile.ts
import FileSaver from 'file-saver';

export const handleSaveToLocalFile = (data: any) => {
  console.log('handleSaveToLocalFile data:', data);
  if (data) {
    const dataWithoutProject = { ...data.project }; // Remove the project key to make it compatible with the old format
    console.log('dataWithoutProject:', dataWithoutProject, data);
    const blob = new Blob([JSON.stringify(dataWithoutProject, null, 2)], { type: 'application/json' });
    FileSaver.saveAs(blob, 'featureAData.json');
  } else {
    alert('No data available to save.');
  }
};