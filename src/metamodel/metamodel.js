// metamodel.js
export const metamodel = {
    objecttypes: [
        { id: '058cbb1b-018e-4959-2a33-a27889543209', name: 'Information' },
        { id: 'bbb60f1c-b5a3-41dc-dff6-2b594f54a2dd', name: 'Role' },
        { id: '29d76eb4-29b7-4cf7-ed16-a1d172738bad', name: 'Task' },
        { id: '6e465c81-59f2-46f8-4c1d-ec5c2e30b358', name: 'View' },
        { id: '7e9386c9-75bc-4239-c040-d328f1c91e1b', name: 'Property' },
        // ...other object types
    ],
    relshiptypes: [
        { id: '5607bf3b-23d3-4141-f95b-06ff806f86f2', name: 'performs', fromobjtypeRef: 'bbb60f1c-b5a3-41dc-dff6-2b594f54a2dd', toobjtypeRef: '29d76eb4-29b7-4cf7-ed16-a1d172738bad' },
        // { id: 'a56028f6-b0c2-43fb-8af4-02f3f80b2de0', name: 'hasInput', from: 'View', to: 'Property' },
        // { id: '1e0f61b2-e636-458c-3306-d281d66f7826', name: 'hasOutput', from: 'View', to: 'Property' },
        // { id: '2fb581fc-6c9c-47d6-e479-9502ffa6c3e5', name: 'fills', from: 'Person', to: 'Role' },
        // { id: '7efd38eb-82a8-457f-9fda-7b75ef71d942', name: 'refersTo', from: 'Task', to: 'Information' },
        // { id: '4f673acd-ca6c-4309-0235-d1d7767c826d', name: 'worksOn', from: 'Task', to: 'Information' },
        // { id: '7b3c0877-0e98-4fc6-2715-5f31e4f30219', name: 'includes', from: 'Container', to: 'any' },
        { id: '7efd38eb-82a8-457f-9fda-7b75ef71d942', name: 'refersTo', fromobjtypeRef: '058cbb1b-018e-4959-2a33-a27889543209', toobjtypeRef: '058cbb1b-018e-4959-2a33-a27889543209' },
        { id: '29e99a05-67af-4499-1d97-49b80a2a72bc', name: 'includes', fromobjtypeRef: '6e465c81-59f2-46f8-4c1d-ec5c2e30b358', toobjtypeRef: '6e465c81-59f2-46f8-4c1d-ec5c2e30b358' },
        { id: '074f512c-574f-47dd-39fa-561d1e7e6e74', name: 'applies', fromobjtypeRef: '29d76eb4-29b7-4cf7-ed16-a1d172738bad', toobjtypeRef: '6e465c81-59f2-46f8-4c1d-ec5c2e30b358' },
        { id: '668978e6-d9ba-4596-1329-6a63d24686e5', name: 'applies', fromobjtypeRef: '6e465c81-59f2-46f8-4c1d-ec5c2e30b358', toobjtypeRef: '058cbb1b-018e-4959-2a33-a27889543209n' },
        { id: '147250de-d71b-484b-57c7-7331c77f88f8', name: 'triggers', fromobjtypeRef: '29d76eb4-29b7-4cf7-ed16-a1d172738bad', toobjtypeRef: '29d76eb4-29b7-4cf7-ed16-a1d172738bad' }, 
        // ...other relationship types
    ],
};
