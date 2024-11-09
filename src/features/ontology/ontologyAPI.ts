import axios from 'axios';

const API_BASE_URL = 'https://api.example.com/ontology';

export const getOntology = async (id: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching ontology:', error);
        throw error;
    }
};

export const createOntology = async (ontologyData: any) => {
    try {
        const response = await axios.post(API_BASE_URL, ontologyData);
        return response.data;
    } catch (error) {
        console.error('Error creating ontology:', error);
        throw error;
    }
};

export const updateOntology = async (id: string, ontologyData: any) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/${id}`, ontologyData);
        return response.data;
    } catch (error) {
        console.error('Error updating ontology:', error);
        throw error;
    }
};

export const deleteOntology = async (id: string) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting ontology:', error);
        throw error;
    }
};