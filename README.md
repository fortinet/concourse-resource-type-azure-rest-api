# Concourse resource type for Azure REST API

This is a Concourse resource type for a fetching the JSON response from making an Azure REST API request over HTTPS.

This resource type requires a service principal under a subscription of a certain Azure account.

## Basic usage

The basic usages of this resource type in your Concourse pipe-line.

***Defining the resource type***:

Example of using the docker image of this project in a private registry.

```yaml
resource_types:
  - name: azure-rest-api
    type: docker-image
    source:
      repository: <private-registry>/azure-rest-api
      username: <username-for-private-registry-authentication>
      password: <password-for-private-registry-authentication>
```

Example of using the docker image of this project in the Docker Hub registry.

*Sorry!* We don't have a plan to publish the docker image of this project to the Docker Hub registry at this moment. But if we were to do so, the source type may look like:

```yaml
resource_types:
  - name: azure-rest-api
    type: docker-image
    source:
      repository: <namespace>/azure-rest-api
      tag: latest
```

***Defining the resource***:

```yaml
resources:
- name: resource-azure-rest-api
    type: azure-rest-api
    source:
      # required
      url: 'https://management.azure.com/subscriptions/((subscription))/providers/Microsoft.Compute/locations/((location))/publishers/((publisher))/artifacttypes/vmimage/offers/((offer))/skus/((sku))/versions?api-version=2020-12-01'
      client_id: ((azure.client_id))
      client_secret: ((azure.client_secret))
      subscription: ((azure.subscription))
      tenant: ((azure.tenant))
```

***Defining a 'get' and a 'task' in jobs***:

```yaml
jobs:
  - name: demo
    public: true
    plan:
      - get: pipeline-repo
      - get: resource-azure-rest-api
        params:
          url: 'https://management.azure.com/subscriptions/((subscription))/providers/Microsoft.Compute/locations/((location))/publishers/((publisher))/artifacttypes/vmimage/offers/((offer))/skus/((sku))/versions?api-version=2020-12-01'
      - task: output-rest-api
        config:
          platform: linux
          image_resource:
            type: docker-image
            source: { repository: busybox }
          inputs:
            - name: resource-azure-rest-api
          outputs:
            - name: demo_outputs
          run:
            path: <a-script-to-run>
```

## Parameters

This is a list of parameters which could be passed as the source of the Azure REST API Concourse resource type.
Note: The mentioned Microsoft Azure resources or services, are the subjects related to the target to send the REST API.

* `url`: *Required.* The full URL of the REST API, including the scheme, host. e.g. `https://management.azure.com/`. It can also include optional query parameters available in each REST API.
* `client_id`: *Required.* The Application (client) ID id of the Azure App in App registrations.
* `client_secret`: *Required.* The client secret of the Azure App in App registrations.
* `subscription`: *Required.* The Subscription.
* `tenant`: *Required.* The Directory (tenant) ID of the Azure App in App registrations.

To find all available REST API, please go to the Microsoft official website: [REST API Browser](https://docs.microsoft.com/en-us/rest/api/). [Example REST API](https://docs.microsoft.com/en-us/rest/api/compute/virtualmachineimages/list).

### API URL segment interpolation

Concourse Vars can be used in the REST API URL.

Examples:

```yaml
resources:
  - name: resource-azure-rest-api
    type: azure-rest-api
    source:
      url: 'https://management.azure.com/subscriptions/((subscription))/providers/Microsoft.Compute/locations/((location))/publishers/((publisher))/artifacttypes/vmimage/offers/((offer))/skus/((sku))/versions?api-version=2020-12-01'
      client_id: ((azure.client_id))
      client_secret: ((azure.client_secret))
      subscription: ((azure.subscription))
      tenant: ((azure.tenant))
```

Non-secret vars can be set like this:

```sh
fly -t [target] set-pipeline -v client_id=my-client-id -v client_secret=my-client-secret
```

Secret vars can be set using credential manager, See docs here: [Vault Credential Manager](https://concourse-ci.org/vault-credential-manager.html#vault-credential-lookup-rules).

Example:

```sh
VAULT_ADDR=https://your-vault
vault login
vault kv put concourse/<team>/<project-name?>/azure client_id=my-client-id client_secret=my-client-secret

```

concourse will search like this:

```text
$CONCOURSE_VAULT_PREFIX/$TEAM_NAME/$PROJECT_NAME/$KEY
$CONCOURSE_VAULT_PREFIX/$TEAM_NAME/$KEY
$CONCOURSE_VAULT_PREFIX/$KEY
```

## Output

The content of the Azure REST API result will be stored in the file with the name: ***api-response.json*** in the destination directory as command line argument $1 given to the ```in``` script.

For example, if the destination directory in $1 is ```/tmp/build/get/```, the file that contains the conent of the result will be: ```/tmp/build/get/api-response.json```.

More detail information about the destination directory can be found in this [Concourse CI](https://concourse-ci.org/implementing-resource-types.html) documentation page.

## Issues

please report issue to the [Issues](https://github.com/fortinet/concourse-resource-type-azure-rest-api/issues) page.

## Support

Fortinet-provided scripts in this and other GitHub projects do not fall under the regular Fortinet technical support scope and are not supported by FortiCare Support Services.
For direct issues, please refer to the [Issues](https://github.com/fortinet/concourse-resource-type-azure-rest-api/issues) tab of this GitHub project.
For other questions related to this project, contact [github@fortinet.com](mailto:github@fortinet.com).

## License

[License](./LICENSE). All rights reserved.
