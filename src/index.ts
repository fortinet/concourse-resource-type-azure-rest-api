/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { URL } from 'url';
import {
    createHash,
    err,
    get,
    getClientSecretCredential,
    inputFetchAll,
    log,
    mask,
    mergeLocalParams,
    out,
    Params,
    put,
    sub,
    Version,
} from './lib';

/**
 * A resource type's check script is invoked to detect new versions of the resource.
 * It is given the configured source and current version on stdin,
 * and must print the array of new versions, in chronological order, to stdout,
 * including the requested version if it's still valid.
 *
 * The data in stdin includes:
 * `source`: an arbitrary JSON object which specifies the location of the resource,
 * including any credentials. This is passed verbatim from the resource configuration.
 * see: https://concourse-ci.org/resources.html
 * `version`: a JSON object with string fields,
 * used to uniquely identify an instance of the resource.
 *
 * The data to write to stdout looks like:
 * [
    { "ref": "61cbef" },
    { "ref": "d74e01" },
    { "ref": "7154fe" }
  ]
 *
 * @param  {string[]} argv all argv
 * @returns {Promise} return nothing
 */
export async function execCheck(): Promise<void> {
    try {
        const input = await inputFetchAll();
        const { source: source } = JSON.parse(input) as {
            source?: Params;
            version?: Version;
        };
        log('running script: check');
        // TODO: remove the comments when the project is complete. Keep them for future debugging.
        // log('argv: ', JSON.stringify(argv, null, 4));
        log('stdin: ', JSON.stringify(input, null, 4));
        // log('source: ', JSON.stringify(source));
        // log(
        //     'version: ',
        //     JSON.stringify({ req_time: String(Math.ceil(Date.now() / 1000)) })
        // );
        const params: Params = mergeLocalParams(source);
        const subURL = sub(params.url, params);
        // log(`url substitute: ${subURL}`);
        const credential = await getClientSecretCredential(
            params.tenant,
            params.client_id,
            params.client_secret
        );
        const result = await get(credential, new URL(subURL));
        // log(result);
        const hash = createHash(JSON.stringify(result));
        const count = (Array.isArray(result) && result.length) || 1;
        const version: Version = {
            hash: hash,
            count: String(count),
        };
        out([version]);
    } catch (error) {
        err(JSON.stringify(error));
    }
    return null;
}

/**
 * The in script is passed a destination directory as command line argument $1,
 * and is given on stdin the configured source and a precise version of the resource to fetch.
 * The script must fetch the resource and place it in the given directory.
 * If the desired resource version is unavailable (for example, if it was deleted),
 * the script must exit with error.
 *
 * The script must emit the fetched version, and may emit metadata as a list of key-value pairs.
 * This data is intended for public consumption and will make it upstream,
 * intended to be shown on the build's page.
 *
 * The data in stdin includes:
 * `source`: an arbitrary JSON object which specifies the location of the resource,
 * `version`: a JSON object with string fields,
 * `params`: an arbitrary JSON object passed along verbatim from get step params on a get step.
 * see: https://concourse-ci.org/jobs.html#schema.step.get-step.params and
 * https://concourse-ci.org/jobs.html#get-step
 *
 * The data to write to stdout looks like:
 * {
     "version": { "ref": "61cebf" },
     "metadata": [
       { "name": "commit", "value": "61cebf" },
       { "name": "author", "value": "Hulk Hogan" }
     ]
   }
 *
 * @param  {string[]} argv all argv including the destination directory
 * @returns {Promise} return nothing
 */
export async function execIn(argv: string[]): Promise<void> {
    try {
        const input = await inputFetchAll();
        const { source: source, version: version } = JSON.parse(input) as {
            source?: Params;
            version?: Version;
        };
        log('running script: in');
        // TODO: remove the comments when the project is complete. Keep them for future debugging.
        // log('argv: ', JSON.stringify(argv, null, 4));
        log('stdin: ', JSON.stringify(input, null, 4));
        // log('source: ', JSON.stringify(source));
        // log('version: ', JSON.stringify(version));

        const params: Params = mergeLocalParams(source);
        const subURL = sub(params.url, params);
        log(`url substitute: ${subURL}`);
        const credential = await getClientSecretCredential(
            params.tenant,
            params.client_id,
            params.client_secret
        );
        const result = await get(credential, new URL(subURL));
        put(argv[2], 'api-response.json', result);
        // meta data
        const metadata: { name: string; value: string }[] = Object.entries(
            params
        ).map(([k, v]) => {
            if (
                [
                    'client_id',
                    'client_secret',
                    'tenant',
                    'subscription',
                ].includes(k)
            ) {
                return {
                    name: k,
                    value: mask(v),
                };
            } else {
                return {
                    name: k,
                    value: v,
                };
            }
        });
        out({
            version: version,
            metadata: [
                {
                    name: 'url:substitute',
                    value: subURL,
                },
                ...metadata,
            ],
        });
    } catch (error) {
        err(JSON.stringify(error));
    }
    return null;
}

/**
 * The out script is passed a path to the directory containing
 * the build's full set of sources as command line argument $1,
 * and is given on stdin the configured params and the resource's source configuration.
 *
 * The script must emit the resulting version of the resource.
 * For example, the git resource emits the SHA of the commit that it has just pushed.
 *
 * Additionally, the script may emit metadata as a list of key-value pairs.
 * This data is intended for public consumption and will make it upstream,
 * intended to be shown on the build's page.
 *
 * The data in stdin includes:
 * `source`: an arbitrary JSON object which specifies the location of the resource,
 * `version`: a JSON object with string fields,
 * `params`: an arbitrary JSON object passed along verbatim from get step params on a get step.
 * see: https://concourse-ci.org/jobs.html#schema.step.get-step.params and
 * https://concourse-ci.org/jobs.html#get-step
 *
 * The data to write to stdout looks like:
 * {
     "version": { "ref": "61cebf" },
     "metadata": [
         { "name": "commit", "value": "61cebf" },
         { "name": "author", "value": "Mick Foley" }
     ]
   }
 *
 * @param  {string[]} argv all argv including the directory where the build's
 * full set of sources is located.
 * @returns {Promise} return nothing
 */
export async function execOut(): Promise<void> {
    try {
        const input = await inputFetchAll();
        const { version: version } = JSON.parse(input);
        log('running script out:');
        // TODO: remove the comments when the project is complete. Keep them for future debugging.
        // log('argv: ', JSON.stringify(argv, null, 4));
        log('stdin: ', JSON.stringify(input, null, 4));
        out({
            version: version,
            metadata: [],
        });
    } catch (error) {
        err(JSON.stringify(error));
    }
    return null;
}
