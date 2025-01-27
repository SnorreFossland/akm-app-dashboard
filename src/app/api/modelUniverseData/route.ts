import { NextApiRequest, NextApiResponse } from 'next';


const url = "https://community.opengroup.org/osdu/data/data-definitions/-/raw/master/E-R/DependenciesAndRelationships.json"

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const response = await fetch(url);
  const data = await response.json();
  res.status(200).json(data);
};