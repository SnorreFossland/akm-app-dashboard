// // src/features/model-universe/components/ModelHeader.tsx
// import React from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faRobot } from '@fortawesome/free-solid-svg-icons';

// interface ModelHeaderProps {
//   metisName?: string;
// }

// const ModelHeader: React.FC<ModelHeaderProps> = ({ metisName }) => {
  
//   const displayName = metisName?.endsWith('.json')
//     ? metisName
//     : metisName ? `${metisName}.json` : '';


//   return (
//     <header className="m-2 me-auto w-full bg-blue-500/60 text-gradient-to-r from-green-700 to-blue-900 text-transparent bg-clip-text shadow-md shadow-green-50/50">
//       <div className="flex justify-between items-center font-bold text-white text-green-500 mx-5">
//         <div className="me-5 mb-0 mt-4 text-muted-foreground">AKM file :
//           <span className="px-2 text-gray-300">{displayName}</span>
//         </div>
//         <div className="me-5 text-3xl rounded bg-green-500/50 text-gradient-to-r from-green-700 to-blue-700 text-transparent bg-clip-text shadow-md shadow-green-500/50">
//           &nbsp;&nbsp; AI Assisted Modeling  &nbsp;&nbsp;
//         </div>
//         <div className="flex items-center mx-5">
//           <div className="mx-4 text-orange-700">AI-Powered Dashboard</div>
//           <FontAwesomeIcon icon={faRobot} className="text-orange-700" />
//         </div>
//       </div>
//     </header>
//   );
// };

// export default ModelHeader;