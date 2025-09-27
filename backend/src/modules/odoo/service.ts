import { JSONRPCClient } from "json-rpc-2.0"

type Options = {
  url: string
  dbName: string
  username: string
  apiKey: string
}

export type Pagination = {
  offset?: number
  limit?: number
}

export type OdooProduct = {
  id: number
  display_name: string
  is_published: boolean
  website_url: string
  name: string
  list_price: number
  description: string
  description_sale: string
  qty_available: number
  location_id: number
  taxes_id: number[]
  hs_code: string
  allow_out_of_stock_order: boolean
  is_kits: boolean
  image_1920: string
  image_1024: string
  image_512: string
  image_256: string
  currency_id: {
    display_name: string
  }
  product_variant_ids: OdooProductVariant[]
  attribute_line_ids: {
    attribute_id: {
      display_name: string
    }
    value_ids: {
      display_name: string
    }[]
  }[]
}

export type OdooProductVariant = {
  id: number
  product_template_variant_value_ids: {
    name: string
    attribute_id: {
      display_name: string
    }
  }[]
  code: string
}

export default class OdooModuleService {
  private options: Options
  private client: JSONRPCClient
  private uid?: number

  constructor({}, options: Options) {
    this.options = options

    this.client = new JSONRPCClient((jsonRPCRequest) => {
      fetch(`${options.url}/jsonrpc`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(jsonRPCRequest),
      }).then((response) => {
        if (response.status === 200) {
          // Use client.receive when you received a JSON-RPC response.
          return response
            .json()
            .then((jsonRPCResponse) => this.client.receive(jsonRPCResponse))
        } else if (jsonRPCRequest.id !== undefined) {
          return Promise.reject(new Error(response.statusText))
        }
      })
    })
  }

  async login() {
    this.uid = await this.client.request("call", {
      service: "common",
      method: "authenticate",
      args: [
        this.options.dbName,
        this.options.username,
        this.options.apiKey,
        {},
      ],
    })
  }

  async listProducts(filters?: any, pagination?: Pagination) {
    if (!this.uid) {
      await this.login()
    }

    const { offset, limit } = pagination || { offset: 0, limit: 10 }

    const ids = await this.client.request("call", {
      service: "object",
      method: "execute_kw",
      args: [
        this.options.dbName,
        this.uid,
        this.options.apiKey,
        "product.template",
        "search",
        filters || [[
          ["is_product_variant", "=", false],
        ]],
        {
          offset,
          limit,
        },
      ],
    })

    const productSpecifications = {
      id: {},
      display_name: {},
      is_published: {},
      website_url: {},
      name: {},
      list_price: {},
      description: {},
      description_sale: {},
      qty_available: {},
      location_id: {},
      taxes_id: {},
      hs_code: {},
      allow_out_of_stock_order: {},
      is_kits: {},
      image_1920: {},
      image_1024: {},
      image_512: {},
      image_256: {},
      currency_id: {
        fields: {
          display_name: {},
        },
      },
    }

    const products: OdooProduct[] = await this.client.request("call", {
      service: "object",
      method: "execute_kw",
      args: [
        this.options.dbName,
        this.uid,
        this.options.apiKey,
        "product.template",
        "web_read",
        [ids],
        {
          specification: {
            ...productSpecifications,
            product_variant_ids: {
              fields: {
                ...productSpecifications,
                product_template_variant_value_ids: {
                  fields: {
                    name: {},
                    attribute_id: {
                      fields: {
                        display_name: {},
                      },
                    },
                  },
                  context: {
                    show_attribute: false,
                  },
                },
                code: {},
              },
              context: {
                show_code: false,
              },
            },
            attribute_line_ids: {
              fields: {
                attribute_id: {
                  fields: {
                    display_name: {},
                  },
                },
                value_ids: {
                  fields: {
                    display_name: {},
                  },
                  context: {
                    show_attribute: false,
                  },
                },
              },
            },
          },
        },
      ],
    })

    return products
  }
}