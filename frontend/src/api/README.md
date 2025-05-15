# API Client - Documentation

## Structure

The API integration is organized following these principles:

- **Modular architecture**: Each API resource has its own client file.
- **Centralized configuration**: Configuration such as URLs and versions is in `src/config/api.ts`.
- **Version compatibility**: All requests include the API version.

## Main files

- `client.ts`: Base Axios client with configuration and interceptors.
- `productsApi.ts`: Product-related operations.
- `cartApi.ts`: Cart-related operations.
- `../config/api.ts`: Centralized configuration.

## Versioning

API versioning is implemented as follows:

1. The current API version is defined in `src/config/api.ts` as `API_VERSION`.
2. All requests use `getApiUrl()` to build URLs with the correct version.
3. Explicit versioning can be enabled/disabled with `USE_VERSIONED_ENDPOINTS`.

## Usage examples

### Basic API call

```typescript
import { getApiUrl } from '../config/api';
import apiClient from './client';

// Example to get resources
const getItems = async () => {
  // Generates: /api/v1/items
  const response = await apiClient.get(getApiUrl('items'));
  return response.data;
};

// Example with query parameters
const searchItems = async (query: string) => {
  const response = await apiClient.get(getApiUrl('items'), {
    params: { search: query }
  });
  return response.data;
};

// Example with ID in the URL
const getItemDetail = async (id: number) => {
  const response = await apiClient.get(getApiUrl(`items/${id}`));
  return response.data;
};
```

## Handling version changes

When the API introduces a new version, you only need to update `API_VERSION` in `config/api.ts`. If structural changes in requests are required, you can:

1. Maintain backward compatibility by keeping current methods.
2. Add new methods with the `V2` suffix for new features.
3. Adapt data between versions in the client to minimize changes in components.

## Debugging

The client includes detailed logs for requests and responses. These logs are enabled by default and show:

- Complete URLs with version
- Sent parameters
- Response data
- Errors with details

To disable logs in production, configure conditional interceptors in `client.ts`.