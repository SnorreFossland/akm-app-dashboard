import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';

const Header = ({ metis }) => (
    <header className="ms-2 me-auto w-full bg-green-500/50 text-gradient-to-r from-green-700 to-blue-700 text-transparent bg-clip-text shadow-md shadow-green-500/50">
        <div className="flex justify-between items-center font-bold text-white mx-5">
            <div className="me-5 text-muted-foreground">AKM file: <span className="px-2 text-gray-300">{metis?.name}.json</span></div>
            <div className="me-5 text-3xl rounded bg-green-500/50 text-gradient-to-r from-green-700 to-blue-700 text-transparent bg-clip-text shadow-md shadow-green-500/50">
                &nbsp;&nbsp; Active Knowledge Lab  &nbsp;&nbsp;
            </div>
            <div className="flex items-center mx-5">
                <div className="mx-4 text-orange-700">AI-Powered AKM Dashboard</div>
                <FontAwesomeIcon icon={faRobot} className="text-orange-700" />
            </div>
        </div>
    </header>
);

export default Header;