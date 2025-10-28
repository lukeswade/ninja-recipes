/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,

 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { GetSignedUrlConfig, Storage } from '@google-cloud/storage';

// Avoid depending on `firebase-functions` in the production server image.
// Use a tiny console-based logger instead of importing from firebase-functions.
const logger = {
  info: (...args: any[]) => console.info(...args),
  error: (...args: any[]) => console.error(...args),
  warn: (...args: any[]) => console.warn(...args),
  debug: (...args: any[]) => (console.debug ? console.debug(...args) : console.log(...args)),
};

// Note: had to manually set this in GCS, see:
// https://cloud.google.com/storage/docs/configuring-cors#gcloud
// Also, couldn't get it to work with a custom domain, using the default
// GCS URL for now.
const GCS_URL_PREFIX = 'https://storage.googleapis.com';
let storage: Storage | null = null;
const DEFAULT_BUCKET = process.env.STORAGE_BUCKET || 'creamininja.appspot.com';

export class ObjectNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ObjectNotFoundError';
  }
}

/**
 * Returns an authenticated GCS client.
 * @returns {Storage}
 */
export function getStorage(): Storage {
  if (storage) {
    return storage;
  }

  // Default: let the client pick up credentials from environment (GCE, service account via ADC, etc)
  storage = new Storage();
  logger.info('Using default Google Cloud Storage client');
  return storage;
}

export function getBucketName() {
  return DEFAULT_BUCKET;
}

/**
 * Generates a signed URL for a given object.
 * @param {string} objectName
 * @returns {Promise<string>}
 */
export async function generateV4ReadSignedUrl(objectName: string): Promise<string> {
  const bucketName = getBucketName();
  const client = getStorage();

  // These options will allow temporary read access to the file
  const options: GetSignedUrlConfig = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };

  try {
    // Get a v4 signed URL for reading the file
    const [url] = await client.bucket(bucketName).file(objectName).getSignedUrl(options);
    return url;
  } catch (err) {
    logger.error(`Failed to generate signed URL for object: ${objectName}`, err);
    throw err;
  }
}

export const ObjectStorageService = {
  generateV4ReadSignedUrl,
};
