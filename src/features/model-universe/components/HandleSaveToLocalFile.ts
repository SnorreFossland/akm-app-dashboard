// src/features/featureA/components/HandleSaveToLocalFile.ts
import FileSaver from 'file-saver';

export const handleSaveToLocalFile = (data: any) => {
  console.log('handleSaveToLocalFile data:', data);
  if (data.phData.domain.name) {
    const shortName = data.phData.domain.name.includes("-") 
      ? data.phData.domain.name.split("-")[0].trim() 
      : data.phData.domain.name;
    const fileName = data.phData.domain.name ? shortName : 'newModelfile';
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    FileSaver.saveAs(blob, fileName + '.json');
  } else {
    alert('No data available to save.');
  }
};