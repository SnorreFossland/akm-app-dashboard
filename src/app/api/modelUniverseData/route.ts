import { NextResponse } from 'next/server';

const url = "https://community.opengroup.org/osdu/data/data-definitions/-/raw/master/E-R/DependenciesAndRelationships.json";

export async function GET() {
  const response = await fetch(url);
  const data = await response.json();
  return NextResponse.json(data);
}