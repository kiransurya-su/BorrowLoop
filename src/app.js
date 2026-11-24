import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';

Polymer({
  is: 'polymer-app',
  properties: {
      items: {
        type: Array,
        value: () => [],
      },
      requests: {
        type: Array,
        value: () => [],
      },
      loading: {
        type: Boolean,
        value: true,
      },
      loadingRequests: {
        type: Boolean,
        value: true,
      },
      apiError: {
        type: String,
        value: '',
      },
      requestsError: {
        type: String,
        value: '',
      },
      selectedItemId: {
        type: Number,
        value: 0,
      },
      borrowerName: {
        type: String,
        value: '',
      },
      returnBy: {
        type: String,
        value: '',
      },
      minimumReturnDate: {
        type: String,
        value: '',
      },
      requestError: {
        type: String,
        value: '',
      },
      requestMessage: {
        type: String,
        value: '',
      },
      isSubmitting: {
        type: Boolean,
        value: false,
      },
      showListingForm: {
        type: Boolean,
        value: false,
      },
      newItemName: {
        type: String,
        value: '',
      },
      newItemCategory: {
        type: String,
        value: 'Tools',
      },
      newItemDescription: {
        type: String,
        value: '',
      },
      newItemOwner: {
        type: String,
        value: '',
      },
      listingError: {
        type: String,
        value: '',
      },
      listingMessage: {
        type: String,
        value: '',
      },
      savingListing: {
        type: Boolean,
        value: false,
      },
      updatingRequestId: {
        type: Number,
        value: 0,
      },
  },
  _template: html`
      <style>
        :host {
          display: block;
          min-height: 100vh;
          color: #17231e;
          background: #f5f7f4;
          font-family: system-ui, sans-serif;
        }

        header {
          padding: 1.25rem max(1.5rem, calc((100% - 1100px) / 2));
          color: white;
          background: #174e3b;
        }

        .brand {
          margin: 0;
          font-size: 1.5rem;
        }

        .tagline {
          margin: 0.25rem 0 0;
          color: #d7e8df;
        }

        main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
        }

        .intro {
          margin-bottom: 2rem;
        }

        .intro h2 {
          margin-bottom: 0.5rem;
          font-size: clamp(1.75rem, 5vw, 2.5rem);
        }

        .intro p {
          max-width: 38rem;
          color: #53645b;
          line-height: 1.6;
        }

        .share-button {
          margin-top: 0.5rem;
        }

        .listing-form {
          display: grid;
          max-width: 36rem;
          gap: 0.65rem;
          margin: 0 0 2rem;
          padding: 1.25rem;
          border: 1px solid #dce5df;
          border-radius: 0.75rem;
          background: white;
        }

        .listing-form h3,
        .listing-form p {
          margin: 0;
        }

        select,
        textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 0.65rem;
          border: 1px solid #aebdb4;
          border-radius: 0.35rem;
          background: white;
          font: inherit;
        }

        textarea {
          min-height: 5rem;
          resize: vertical;
        }

        .items {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        article {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1.25rem;
          border: 1px solid #dce5df;
          border-radius: 0.75rem;
          background: white;
        }

        article h3,
        article p {
          margin: 0;
        }

        .category {
          color: #287252;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .description,
        .owner {
          color: #53645b;
          line-height: 1.5;
        }

        button {
          width: fit-content;
          padding: 0.65rem 0.9rem;
          border: 0;
          border-radius: 0.4rem;
          color: white;
          background: #176444;
          font: inherit;
          font-weight: 650;
          cursor: pointer;
        }

        button:hover {
          background: #104c33;
        }

        button:focus-visible,
        input:focus-visible {
          outline: 3px solid #e8ad4c;
          outline-offset: 2px;
        }

        button[disabled] {
          cursor: wait;
          opacity: 0.7;
        }

        form {
          display: grid;
          gap: 0.6rem;
          margin-top: 0.25rem;
          padding-top: 1rem;
          border-top: 1px solid #e5ebe7;
        }

        input {
          width: 100%;
          box-sizing: border-box;
          padding: 0.65rem;
          border: 1px solid #aebdb4;
          border-radius: 0.35rem;
          font: inherit;
        }

        label {
          font-weight: 600;
        }

        .form-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .cancel {
          color: #174e3b;
          background: transparent;
        }

        .cancel:hover {
          color: #104c33;
          background: #edf4ef;
        }

        .message {
          color: #176444;
        }

        .error {
          color: #a02727;
        }

        .requests {
          margin-top: 3rem;
        }

        .request-list {
          display: grid;
          gap: 0.75rem;
          padding: 0;
          list-style: none;
        }

        .request-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 1rem;
          border: 1px solid #dce5df;
          border-radius: 0.6rem;
          background: white;
        }

        .request-row p {
          margin: 0.2rem 0;
        }
      </style>

      <header>
        <h1 class="brand">BorrowLoop</h1>
        <p class="tagline">Borrow what you need. Share what you have.</p>
      </header>

      <main>
        <section class="intro">
          <h2>Useful things, shared nearby.</h2>
          <p>
            Find an item from a neighbor and send a borrowing request. Choose
            something below to get started.
          </p>
          <button
            class="share-button"
            type="button"
            on-click="_toggleListingForm"
          >
            Share an item
          </button>
        </section>

        <template is="dom-if" if="[[showListingForm]]">
          <form class="listing-form" on-submit="_submitListing">
            <h3>Add an item to share</h3>
            <label for="itemName">Item name</label>
            <input
              id="itemName"
              type="text"
              minlength="2"
              maxlength="80"
              required
              value="{{newItemName::input}}"
            />
            <label for="itemCategory">Category</label>
            <select
              id="itemCategory"
              required
              value="{{newItemCategory::change}}"
            >
              <option>Tools</option>
              <option>Outdoors</option>
              <option>Kitchen</option>
              <option>Electronics</option>
              <option>Games</option>
              <option>Other</option>
            </select>
            <label for="itemDescription">Description</label>
            <textarea
              id="itemDescription"
              maxlength="300"
              required
              value="{{newItemDescription::input}}"
            ></textarea>
            <label for="itemOwner">Your name</label>
            <input
              id="itemOwner"
              type="text"
              minlength="2"
              maxlength="60"
              required
              value="{{newItemOwner::input}}"
            />
            <template is="dom-if" if="[[listingError]]">
              <p class="error" role="alert">[[listingError]]</p>
            </template>
            <div class="form-actions">
              <button type="submit" disabled$="[[savingListing]]">
                Add listing
              </button>
              <button
                class="cancel"
                type="button"
                on-click="_toggleListingForm"
              >
                Cancel
              </button>
            </div>
          </form>
        </template>
        <template is="dom-if" if="[[listingMessage]]">
          <p class="message" role="status">[[listingMessage]]</p>
        </template>

        <template is="dom-if" if="[[loading]]">
          <p role="status">Loading available items...</p>
        </template>
        <template is="dom-if" if="[[apiError]]">
          <p class="error" role="alert">[[apiError]]</p>
        </template>

        <section class="items" aria-label="Available items">
          <template is="dom-repeat" items="[[items]]" as="item">
            <article>
              <p class="category">[[item.category]]</p>
              <h3>[[item.name]]</h3>
              <p class="description">[[item.description]]</p>
              <p class="owner">Shared by [[item.ownerName]]</p>
              <button type="button" on-click="_startRequest">
                Request to borrow
              </button>

              <template is="dom-if" if="[[_isSelected(item.id, selectedItemId)]]">
                <form on-submit="_submitRequest">
                  <label for="borrowerName">Your name</label>
                  <input
                    id="borrowerName"
                    name="borrowerName"
                    type="text"
                    minlength="2"
                    maxlength="60"
                    autocomplete="name"
                    required
                    value="{{borrowerName::input}}"
                  />
                  <label for="returnBy">Return by</label>
                  <input
                    id="returnBy"
                    name="returnBy"
                    type="date"
                    min$="[[minimumReturnDate]]"
                    required
                    value="{{returnBy::input}}"
                  />
                  <template is="dom-if" if="[[requestError]]">
                    <p class="error" role="alert">[[requestError]]</p>
                  </template>
                  <template is="dom-if" if="[[requestMessage]]">
                    <p class="message" role="status">[[requestMessage]]</p>
                  </template>
                  <div class="form-actions">
                    <button type="submit" disabled$="[[isSubmitting]]">
                      Send request
                    </button>
                    <button
                      class="cancel"
                      type="button"
                      on-click="_cancelRequest"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </template>
            </article>
          </template>
        </section>

        <section class="requests" aria-labelledby="requestsHeading">
          <h2 id="requestsHeading">Borrow requests</h2>
          <template is="dom-if" if="[[loadingRequests]]">
            <p role="status">Loading requests...</p>
          </template>
          <template is="dom-if" if="[[requestsError]]">
            <p class="error" role="alert">[[requestsError]]</p>
          </template>
          <template is="dom-if" if="[[_hasNoRequests(requests, loadingRequests)]]">
            <p>No borrowing requests yet.</p>
          </template>
          <ul class="request-list">
            <template is="dom-repeat" items="[[requests]]" as="request">
              <li class="request-row">
                <div>
                  <p>
                    <strong>[[request.itemName]]</strong>
                    requested by [[request.borrowerName]]
                  </p>
                  <p>Return by [[request.returnBy]] · [[request.status]]</p>
                </div>
                <template is="dom-if" if="[[_isPending(request.status)]]">
                  <button
                    type="button"
                    disabled$="[[_isUpdating(request.id, updatingRequestId)]]"
                    on-click="_advanceRequest"
                  >
                    Approve
                  </button>
                </template>
                <template is="dom-if" if="[[_isApproved(request.status)]]">
                  <button
                    type="button"
                    disabled$="[[_isUpdating(request.id, updatingRequestId)]]"
                    on-click="_advanceRequest"
                  >
                    Mark returned
                  </button>
                </template>
              </li>
            </template>
          </ul>
        </section>
      </main>
  `,

  attached() {
    this.returnBy = new Date().toISOString().slice(0, 10);
    this.minimumReturnDate = this.returnBy;
    this._loadItems();
    this._loadRequests();
  },

  async _loadItems() {
    this.loading = true;
    this.apiError = '';

    try {
      const response = await fetch('/api/items');
      this.items = await this._readApiResponse(response, 'Could not load items.');
    } catch (error) {
      this.apiError =
        error instanceof Error ? error.message : 'Could not load items.';
    } finally {
      this.loading = false;
    }
  },

  async _loadRequests() {
    this.loadingRequests = true;
    this.requestsError = '';

    try {
      const response = await fetch('/api/requests');
      this.requests = await this._readApiResponse(
        response,
        'Could not load requests.',
      );
    } catch (error) {
      this.requestsError =
        error instanceof Error ? error.message : 'Could not load requests.';
    } finally {
      this.loadingRequests = false;
    }
  },

  _isSelected(itemId, selectedItemId) {
    return itemId === selectedItemId;
  },

  _isPending(status) {
    return status === 'pending';
  },

  _isApproved(status) {
    return status === 'approved';
  },

  _isUpdating(requestId, updatingRequestId) {
    return requestId === updatingRequestId;
  },

  _hasNoRequests(requests, loadingRequests) {
    return !loadingRequests && requests.length === 0;
  },

  async _readApiResponse(response, fallbackMessage) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(
        'The API returned a non-JSON response. Stop old servers and restart with npm run dev.',
      );
    }

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || fallbackMessage);
    }
    return result;
  },

  _startRequest(event) {
    const { item } = event.model;
    this.selectedItemId = item.id;
    this.borrowerName = '';
    this.returnBy = new Date().toISOString().slice(0, 10);
    this.requestError = '';
    this.requestMessage = '';
  },

  _cancelRequest() {
    this.selectedItemId = 0;
    this.requestError = '';
    this.requestMessage = '';
  },

  async _submitRequest(event) {
    event.preventDefault();
    if (this.isSubmitting || !this.selectedItemId) {
      return;
    }

    this.isSubmitting = true;
    this.requestError = '';
    this.requestMessage = '';

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: this.selectedItemId,
          borrowerName: this.borrowerName,
          returnBy: this.returnBy,
        }),
      });
      const result = await this._readApiResponse(
        response,
        'Could not send your request.',
      );
      this.requestMessage = `Request sent for ${result.itemName}.`;
      await this._loadRequests();
    } catch (error) {
      this.requestError =
        error instanceof Error ? error.message : 'Could not send your request.';
    } finally {
      this.isSubmitting = false;
    }
  },

  _toggleListingForm() {
    this.showListingForm = !this.showListingForm;
    this.listingError = '';
  },

  async _submitListing(event) {
    event.preventDefault();
    if (this.savingListing) {
      return;
    }

    this.savingListing = true;
    this.listingError = '';
    this.listingMessage = '';

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.newItemName,
          category: this.newItemCategory,
          description: this.newItemDescription,
          ownerName: this.newItemOwner,
        }),
      });
      const result = await this._readApiResponse(
        response,
        'Could not add this item.',
      );
      this.items = [result, ...this.items];
      this.showListingForm = false;
      this.newItemName = '';
      this.newItemDescription = '';
      this.newItemOwner = '';
      this.listingMessage = `${result.name} is now listed for sharing.`;
    } catch (error) {
      this.listingError =
        error instanceof Error ? error.message : 'Could not add this item.';
    } finally {
      this.savingListing = false;
    }
  },

  async _advanceRequest(event) {
    const { request } = event.model;
    const status = request.status === 'pending' ? 'approved' : 'returned';
    this.updatingRequestId = request.id;
    this.requestsError = '';

    try {
      const response = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      await this._readApiResponse(response, 'Could not update this request.');
      await Promise.all([this._loadItems(), this._loadRequests()]);
    } catch (error) {
      this.requestsError =
        error instanceof Error ? error.message : 'Could not update this request.';
    } finally {
      this.updatingRequestId = 0;
    }
  },
});
