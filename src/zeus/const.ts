/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	Query:{
		administrators:{
			options:"AdministratorListOptions"
		},
		administrator:{

		},
		assets:{
			options:"AssetListOptions"
		},
		asset:{

		},
		channels:{
			options:"ChannelListOptions"
		},
		channel:{

		},
		collections:{
			options:"CollectionListOptions"
		},
		collection:{

		},
		previewCollectionVariants:{
			input:"PreviewCollectionVariantsInput",
			options:"ProductVariantListOptions"
		},
		countries:{
			options:"CountryListOptions"
		},
		country:{

		},
		customerGroups:{
			options:"CustomerGroupListOptions"
		},
		customerGroup:{

		},
		customers:{
			options:"CustomerListOptions"
		},
		customer:{

		},
		facets:{
			options:"FacetListOptions"
		},
		facet:{

		},
		facetValues:{
			options:"FacetValueListOptions"
		},
		job:{

		},
		jobs:{
			options:"JobListOptions"
		},
		jobsById:{

		},
		jobBufferSize:{

		},
		order:{

		},
		orders:{
			options:"OrderListOptions"
		},
		eligibleShippingMethodsForDraftOrder:{

		},
		paymentMethods:{
			options:"PaymentMethodListOptions"
		},
		paymentMethod:{

		},
		productOptionGroups:{

		},
		productOptionGroup:{

		},
		search:{
			input:"SearchInput"
		},
		products:{
			options:"ProductListOptions"
		},
		product:{

		},
		productVariants:{
			options:"ProductVariantListOptions"
		},
		productVariant:{

		},
		promotion:{

		},
		promotions:{
			options:"PromotionListOptions"
		},
		provinces:{
			options:"ProvinceListOptions"
		},
		province:{

		},
		roles:{
			options:"RoleListOptions"
		},
		role:{

		},
		sellers:{
			options:"SellerListOptions"
		},
		seller:{

		},
		shippingMethods:{
			options:"ShippingMethodListOptions"
		},
		shippingMethod:{

		},
		testShippingMethod:{
			input:"TestShippingMethodInput"
		},
		testEligibleShippingMethods:{
			input:"TestEligibleShippingMethodsInput"
		},
		stockLocation:{

		},
		stockLocations:{
			options:"StockLocationListOptions"
		},
		tag:{

		},
		tags:{
			options:"TagListOptions"
		},
		taxCategories:{
			options:"TaxCategoryListOptions"
		},
		taxCategory:{

		},
		taxRates:{
			options:"TaxRateListOptions"
		},
		taxRate:{

		},
		zones:{
			options:"ZoneListOptions"
		},
		zone:{

		},
		metricSummary:{
			input:"MetricSummaryInput"
		}
	},
	Mutation:{
		createAdministrator:{
			input:"CreateAdministratorInput"
		},
		updateAdministrator:{
			input:"UpdateAdministratorInput"
		},
		updateActiveAdministrator:{
			input:"UpdateActiveAdministratorInput"
		},
		deleteAdministrator:{

		},
		deleteAdministrators:{

		},
		assignRoleToAdministrator:{

		},
		createAssets:{
			input:"CreateAssetInput"
		},
		updateAsset:{
			input:"UpdateAssetInput"
		},
		deleteAsset:{
			input:"DeleteAssetInput"
		},
		deleteAssets:{
			input:"DeleteAssetsInput"
		},
		assignAssetsToChannel:{
			input:"AssignAssetsToChannelInput"
		},
		login:{

		},
		authenticate:{
			input:"AuthenticationInput"
		},
		createChannel:{
			input:"CreateChannelInput"
		},
		updateChannel:{
			input:"UpdateChannelInput"
		},
		deleteChannel:{

		},
		deleteChannels:{

		},
		createCollection:{
			input:"CreateCollectionInput"
		},
		updateCollection:{
			input:"UpdateCollectionInput"
		},
		deleteCollection:{

		},
		deleteCollections:{

		},
		moveCollection:{
			input:"MoveCollectionInput"
		},
		assignCollectionsToChannel:{
			input:"AssignCollectionsToChannelInput"
		},
		removeCollectionsFromChannel:{
			input:"RemoveCollectionsFromChannelInput"
		},
		createCountry:{
			input:"CreateCountryInput"
		},
		updateCountry:{
			input:"UpdateCountryInput"
		},
		deleteCountry:{

		},
		deleteCountries:{

		},
		createCustomerGroup:{
			input:"CreateCustomerGroupInput"
		},
		updateCustomerGroup:{
			input:"UpdateCustomerGroupInput"
		},
		deleteCustomerGroup:{

		},
		deleteCustomerGroups:{

		},
		addCustomersToGroup:{

		},
		removeCustomersFromGroup:{

		},
		createCustomer:{
			input:"CreateCustomerInput"
		},
		updateCustomer:{
			input:"UpdateCustomerInput"
		},
		deleteCustomer:{

		},
		deleteCustomers:{

		},
		createCustomerAddress:{
			input:"CreateAddressInput"
		},
		updateCustomerAddress:{
			input:"UpdateAddressInput"
		},
		deleteCustomerAddress:{

		},
		addNoteToCustomer:{
			input:"AddNoteToCustomerInput"
		},
		updateCustomerNote:{
			input:"UpdateCustomerNoteInput"
		},
		deleteCustomerNote:{

		},
		duplicateEntity:{
			input:"DuplicateEntityInput"
		},
		createFacet:{
			input:"CreateFacetInput"
		},
		updateFacet:{
			input:"UpdateFacetInput"
		},
		deleteFacet:{

		},
		deleteFacets:{

		},
		createFacetValues:{
			input:"CreateFacetValueInput"
		},
		updateFacetValues:{
			input:"UpdateFacetValueInput"
		},
		deleteFacetValues:{

		},
		assignFacetsToChannel:{
			input:"AssignFacetsToChannelInput"
		},
		removeFacetsFromChannel:{
			input:"RemoveFacetsFromChannelInput"
		},
		updateGlobalSettings:{
			input:"UpdateGlobalSettingsInput"
		},
		importProducts:{
			csvFile:"Upload"
		},
		removeSettledJobs:{
			olderThan:"DateTime"
		},
		cancelJob:{

		},
		flushBufferedJobs:{

		},
		settlePayment:{

		},
		cancelPayment:{

		},
		addFulfillmentToOrder:{
			input:"FulfillOrderInput"
		},
		cancelOrder:{
			input:"CancelOrderInput"
		},
		refundOrder:{
			input:"RefundOrderInput"
		},
		settleRefund:{
			input:"SettleRefundInput"
		},
		addNoteToOrder:{
			input:"AddNoteToOrderInput"
		},
		updateOrderNote:{
			input:"UpdateOrderNoteInput"
		},
		deleteOrderNote:{

		},
		transitionOrderToState:{

		},
		transitionFulfillmentToState:{

		},
		transitionPaymentToState:{

		},
		setOrderCustomFields:{
			input:"UpdateOrderInput"
		},
		setOrderCustomer:{
			input:"SetOrderCustomerInput"
		},
		modifyOrder:{
			input:"ModifyOrderInput"
		},
		addManualPaymentToOrder:{
			input:"ManualPaymentInput"
		},
		deleteDraftOrder:{

		},
		addItemToDraftOrder:{
			input:"AddItemToDraftOrderInput"
		},
		adjustDraftOrderLine:{
			input:"AdjustDraftOrderLineInput"
		},
		removeDraftOrderLine:{

		},
		setCustomerForDraftOrder:{
			input:"CreateCustomerInput"
		},
		setDraftOrderShippingAddress:{
			input:"CreateAddressInput"
		},
		setDraftOrderBillingAddress:{
			input:"CreateAddressInput"
		},
		setDraftOrderCustomFields:{
			input:"UpdateOrderInput"
		},
		applyCouponCodeToDraftOrder:{

		},
		removeCouponCodeFromDraftOrder:{

		},
		setDraftOrderShippingMethod:{

		},
		createPaymentMethod:{
			input:"CreatePaymentMethodInput"
		},
		updatePaymentMethod:{
			input:"UpdatePaymentMethodInput"
		},
		deletePaymentMethod:{

		},
		deletePaymentMethods:{

		},
		assignPaymentMethodsToChannel:{
			input:"AssignPaymentMethodsToChannelInput"
		},
		removePaymentMethodsFromChannel:{
			input:"RemovePaymentMethodsFromChannelInput"
		},
		createProductOptionGroup:{
			input:"CreateProductOptionGroupInput"
		},
		updateProductOptionGroup:{
			input:"UpdateProductOptionGroupInput"
		},
		createProductOption:{
			input:"CreateProductOptionInput"
		},
		updateProductOption:{
			input:"UpdateProductOptionInput"
		},
		deleteProductOption:{

		},
		createProduct:{
			input:"CreateProductInput"
		},
		updateProduct:{
			input:"UpdateProductInput"
		},
		updateProducts:{
			input:"UpdateProductInput"
		},
		deleteProduct:{

		},
		deleteProducts:{

		},
		addOptionGroupToProduct:{

		},
		removeOptionGroupFromProduct:{

		},
		createProductVariants:{
			input:"CreateProductVariantInput"
		},
		updateProductVariants:{
			input:"UpdateProductVariantInput"
		},
		deleteProductVariant:{

		},
		deleteProductVariants:{

		},
		assignProductsToChannel:{
			input:"AssignProductsToChannelInput"
		},
		removeProductsFromChannel:{
			input:"RemoveProductsFromChannelInput"
		},
		assignProductVariantsToChannel:{
			input:"AssignProductVariantsToChannelInput"
		},
		removeProductVariantsFromChannel:{
			input:"RemoveProductVariantsFromChannelInput"
		},
		createPromotion:{
			input:"CreatePromotionInput"
		},
		updatePromotion:{
			input:"UpdatePromotionInput"
		},
		deletePromotion:{

		},
		deletePromotions:{

		},
		assignPromotionsToChannel:{
			input:"AssignPromotionsToChannelInput"
		},
		removePromotionsFromChannel:{
			input:"RemovePromotionsFromChannelInput"
		},
		createProvince:{
			input:"CreateProvinceInput"
		},
		updateProvince:{
			input:"UpdateProvinceInput"
		},
		deleteProvince:{

		},
		createRole:{
			input:"CreateRoleInput"
		},
		updateRole:{
			input:"UpdateRoleInput"
		},
		deleteRole:{

		},
		deleteRoles:{

		},
		createSeller:{
			input:"CreateSellerInput"
		},
		updateSeller:{
			input:"UpdateSellerInput"
		},
		deleteSeller:{

		},
		deleteSellers:{

		},
		createShippingMethod:{
			input:"CreateShippingMethodInput"
		},
		updateShippingMethod:{
			input:"UpdateShippingMethodInput"
		},
		deleteShippingMethod:{

		},
		deleteShippingMethods:{

		},
		assignShippingMethodsToChannel:{
			input:"AssignShippingMethodsToChannelInput"
		},
		removeShippingMethodsFromChannel:{
			input:"RemoveShippingMethodsFromChannelInput"
		},
		createStockLocation:{
			input:"CreateStockLocationInput"
		},
		updateStockLocation:{
			input:"UpdateStockLocationInput"
		},
		deleteStockLocation:{
			input:"DeleteStockLocationInput"
		},
		deleteStockLocations:{
			input:"DeleteStockLocationInput"
		},
		assignStockLocationsToChannel:{
			input:"AssignStockLocationsToChannelInput"
		},
		removeStockLocationsFromChannel:{
			input:"RemoveStockLocationsFromChannelInput"
		},
		createTag:{
			input:"CreateTagInput"
		},
		updateTag:{
			input:"UpdateTagInput"
		},
		deleteTag:{

		},
		createTaxCategory:{
			input:"CreateTaxCategoryInput"
		},
		updateTaxCategory:{
			input:"UpdateTaxCategoryInput"
		},
		deleteTaxCategory:{

		},
		deleteTaxCategories:{

		},
		createTaxRate:{
			input:"CreateTaxRateInput"
		},
		updateTaxRate:{
			input:"UpdateTaxRateInput"
		},
		deleteTaxRate:{

		},
		deleteTaxRates:{

		},
		createZone:{
			input:"CreateZoneInput"
		},
		updateZone:{
			input:"UpdateZoneInput"
		},
		deleteZone:{

		},
		deleteZones:{

		},
		addMembersToZone:{

		},
		removeMembersFromZone:{

		}
	},
	AdministratorListOptions:{
		sort:"AdministratorSortParameter",
		filter:"AdministratorFilterParameter",
		filterOperator:"LogicalOperator"
	},
	CreateAdministratorInput:{
		customFields:"JSON"
	},
	UpdateAdministratorInput:{
		customFields:"JSON"
	},
	UpdateActiveAdministratorInput:{
		customFields:"JSON"
	},
	AssetListOptions:{
		tagsOperator:"LogicalOperator",
		sort:"AssetSortParameter",
		filter:"AssetFilterParameter",
		filterOperator:"LogicalOperator"
	},
	CreateAssetInput:{
		file:"Upload",
		customFields:"JSON"
	},
	CoordinateInput:{

	},
	DeleteAssetInput:{

	},
	DeleteAssetsInput:{

	},
	UpdateAssetInput:{
		focalPoint:"CoordinateInput",
		customFields:"JSON"
	},
	AssignAssetsToChannelInput:{

	},
	AuthenticationInput:{
		native:"NativeAuthInput"
	},
	ChannelListOptions:{
		sort:"ChannelSortParameter",
		filter:"ChannelFilterParameter",
		filterOperator:"LogicalOperator"
	},
	CreateChannelInput:{
		defaultLanguageCode:"LanguageCode",
		availableLanguageCodes:"LanguageCode",
		defaultCurrencyCode:"CurrencyCode",
		availableCurrencyCodes:"CurrencyCode",
		customFields:"JSON"
	},
	UpdateChannelInput:{
		defaultLanguageCode:"LanguageCode",
		availableLanguageCodes:"LanguageCode",
		defaultCurrencyCode:"CurrencyCode",
		availableCurrencyCodes:"CurrencyCode",
		customFields:"JSON"
	},
	Collection:{
		productVariants:{
			options:"ProductVariantListOptions"
		}
	},
	CollectionListOptions:{
		sort:"CollectionSortParameter",
		filter:"CollectionFilterParameter",
		filterOperator:"LogicalOperator"
	},
	MoveCollectionInput:{

	},
	CreateCollectionTranslationInput:{
		languageCode:"LanguageCode",
		customFields:"JSON"
	},
	UpdateCollectionTranslationInput:{
		languageCode:"LanguageCode",
		customFields:"JSON"
	},
	CreateCollectionInput:{
		filters:"ConfigurableOperationInput",
		translations:"CreateCollectionTranslationInput",
		customFields:"JSON"
	},
	PreviewCollectionVariantsInput:{
		filters:"ConfigurableOperationInput"
	},
	UpdateCollectionInput:{
		filters:"ConfigurableOperationInput",
		translations:"UpdateCollectionTranslationInput",
		customFields:"JSON"
	},
	AssignCollectionsToChannelInput:{

	},
	RemoveCollectionsFromChannelInput:{

	},
	CountryTranslationInput:{
		languageCode:"LanguageCode",
		customFields:"JSON"
	},
	CreateCountryInput:{
		translations:"CountryTranslationInput",
		customFields:"JSON"
	},
	UpdateCountryInput:{
		translations:"CountryTranslationInput",
		customFields:"JSON"
	},
	CountryListOptions:{
		sort:"CountrySortParameter",
		filter:"CountryFilterParameter",
		filterOperator:"LogicalOperator"
	},
	Customer:{
		history:{
			options:"HistoryEntryListOptions"
		},
		orders:{
			options:"OrderListOptions"
		}
	},
	CustomerGroupListOptions:{
		sort:"CustomerGroupSortParameter",
		filter:"CustomerGroupFilterParameter",
		filterOperator:"LogicalOperator"
	},
	CreateCustomerGroupInput:{
		customFields:"JSON"
	},
	UpdateCustomerGroupInput:{
		customFields:"JSON"
	},
	UpdateCustomerInput:{
		customFields:"JSON"
	},
	CustomerFilterParameter:{
		postalCode:"StringOperators",
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		title:"StringOperators",
		firstName:"StringOperators",
		lastName:"StringOperators",
		phoneNumber:"StringOperators",
		emailAddress:"StringOperators",
		_and:"CustomerFilterParameter",
		_or:"CustomerFilterParameter"
	},
	CustomerListOptions:{
		sort:"CustomerSortParameter",
		filter:"CustomerFilterParameter",
		filterOperator:"LogicalOperator"
	},
	AddNoteToCustomerInput:{

	},
	UpdateCustomerNoteInput:{

	},
	DuplicateEntityInput:{
		duplicatorInput:"ConfigurableOperationInput"
	},
	Facet:{
		valueList:{
			options:"FacetValueListOptions"
		}
	},
	FacetListOptions:{
		sort:"FacetSortParameter",
		filter:"FacetFilterParameter",
		filterOperator:"LogicalOperator"
	},
	FacetTranslationInput:{
		languageCode:"LanguageCode",
		customFields:"JSON"
	},
	CreateFacetInput:{
		translations:"FacetTranslationInput",
		values:"CreateFacetValueWithFacetInput",
		customFields:"JSON"
	},
	UpdateFacetInput:{
		translations:"FacetTranslationInput",
		customFields:"JSON"
	},
	FacetValueTranslationInput:{
		languageCode:"LanguageCode",
		customFields:"JSON"
	},
	CreateFacetValueWithFacetInput:{
		translations:"FacetValueTranslationInput"
	},
	CreateFacetValueInput:{
		translations:"FacetValueTranslationInput",
		customFields:"JSON"
	},
	UpdateFacetValueInput:{
		translations:"FacetValueTranslationInput",
		customFields:"JSON"
	},
	AssignFacetsToChannelInput:{

	},
	RemoveFacetsFromChannelInput:{

	},
	UpdateGlobalSettingsInput:{
		availableLanguages:"LanguageCode",
		customFields:"JSON"
	},
	JobState: "enum" as const,
	JobListOptions:{
		sort:"JobSortParameter",
		filter:"JobFilterParameter",
		filterOperator:"LogicalOperator"
	},
	Order:{
		history:{
			options:"HistoryEntryListOptions"
		}
	},
	OrderFilterParameter:{
		customerLastName:"StringOperators",
		transactionId:"StringOperators",
		aggregateOrderId:"IDOperators",
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		type:"StringOperators",
		orderPlacedAt:"DateOperators",
		code:"StringOperators",
		state:"StringOperators",
		active:"BooleanOperators",
		totalQuantity:"NumberOperators",
		subTotal:"NumberOperators",
		subTotalWithTax:"NumberOperators",
		currencyCode:"StringOperators",
		shipping:"NumberOperators",
		shippingWithTax:"NumberOperators",
		total:"NumberOperators",
		totalWithTax:"NumberOperators",
		_and:"OrderFilterParameter",
		_or:"OrderFilterParameter"
	},
	OrderSortParameter:{
		customerLastName:"SortOrder",
		transactionId:"SortOrder",
		aggregateOrderId:"SortOrder",
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		orderPlacedAt:"SortOrder",
		code:"SortOrder",
		state:"SortOrder",
		totalQuantity:"SortOrder",
		subTotal:"SortOrder",
		subTotalWithTax:"SortOrder",
		shipping:"SortOrder",
		shippingWithTax:"SortOrder",
		total:"SortOrder",
		totalWithTax:"SortOrder"
	},
	OrderListOptions:{
		sort:"OrderSortParameter",
		filter:"OrderFilterParameter",
		filterOperator:"LogicalOperator"
	},
	SetOrderCustomerInput:{

	},
	UpdateOrderInput:{
		customFields:"JSON"
	},
	FulfillOrderInput:{
		lines:"OrderLineInput",
		handler:"ConfigurableOperationInput"
	},
	CancelOrderInput:{
		lines:"OrderLineInput"
	},
	RefundOrderInput:{
		lines:"OrderLineInput",
		shipping:"Money",
		adjustment:"Money",
		amount:"Money"
	},
	OrderLineInput:{
		customFields:"OrderLineCustomFieldsInput"
	},
	SettleRefundInput:{

	},
	AddNoteToOrderInput:{

	},
	UpdateOrderNoteInput:{

	},
	AdministratorPaymentInput:{
		metadata:"JSON"
	},
	AdministratorRefundInput:{
		amount:"Money"
	},
	ModifyOrderOptions:{

	},
	UpdateOrderAddressInput:{

	},
	ModifyOrderInput:{
		addItems:"AddItemInput",
		adjustOrderLines:"OrderLineInput",
		surcharges:"SurchargeInput",
		updateShippingAddress:"UpdateOrderAddressInput",
		updateBillingAddress:"UpdateOrderAddressInput",
		refund:"AdministratorRefundInput",
		refunds:"AdministratorRefundInput",
		options:"ModifyOrderOptions"
	},
	AddItemInput:{
		customFields:"OrderLineCustomFieldsInput"
	},
	SurchargeInput:{
		price:"Money"
	},
	ManualPaymentInput:{
		metadata:"JSON"
	},
	AddItemToDraftOrderInput:{
		customFields:"OrderLineCustomFieldsInput"
	},
	AdjustDraftOrderLineInput:{
		customFields:"OrderLineCustomFieldsInput"
	},
	PaymentMethodListOptions:{
		sort:"PaymentMethodSortParameter",
		filter:"PaymentMethodFilterParameter",
		filterOperator:"LogicalOperator"
	},
	PaymentMethodTranslationInput:{
		languageCode:"LanguageCode",
		customFields:"JSON"
	},
	CreatePaymentMethodInput:{
		checker:"ConfigurableOperationInput",
		handler:"ConfigurableOperationInput",
		translations:"PaymentMethodTranslationInput",
		customFields:"JSON"
	},
	UpdatePaymentMethodInput:{
		checker:"ConfigurableOperationInput",
		handler:"ConfigurableOperationInput",
		translations:"PaymentMethodTranslationInput",
		customFields:"JSON"
	},
	AssignPaymentMethodsToChannelInput:{

	},
	RemovePaymentMethodsFromChannelInput:{

	},
	Product:{
		variantList:{
			options:"ProductVariantListOptions"
		}
	},
	ProductVariant:{
		stockMovements:{
			options:"StockMovementListOptions"
		}
	},
	ProductOptionGroupTranslationInput:{
		languageCode:"LanguageCode",
		customFields:"JSON"
	},
	CreateProductOptionGroupInput:{
		translations:"ProductOptionGroupTranslationInput",
		options:"CreateGroupOptionInput",
		customFields:"JSON"
	},
	UpdateProductOptionGroupInput:{
		translations:"ProductOptionGroupTranslationInput",
		customFields:"JSON"
	},
	ProductOptionTranslationInput:{
		languageCode:"LanguageCode",
		customFields:"JSON"
	},
	CreateGroupOptionInput:{
		translations:"ProductOptionGroupTranslationInput"
	},
	CreateProductOptionInput:{
		translations:"ProductOptionGroupTranslationInput",
		customFields:"JSON"
	},
	UpdateProductOptionInput:{
		translations:"ProductOptionGroupTranslationInput",
		customFields:"JSON"
	},
	StockMovementListOptions:{
		type:"StockMovementType"
	},
	ProductListOptions:{
		sort:"ProductSortParameter",
		filter:"ProductFilterParameter",
		filterOperator:"LogicalOperator"
	},
	ProductFilterParameter:{
		facetValueId:"IDOperators",
		sku:"StringOperators",
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		languageCode:"StringOperators",
		name:"StringOperators",
		slug:"StringOperators",
		description:"StringOperators",
		enabled:"BooleanOperators",
		_and:"ProductFilterParameter",
		_or:"ProductFilterParameter"
	},
	ProductVariantListOptions:{
		sort:"ProductVariantSortParameter",
		filter:"ProductVariantFilterParameter",
		filterOperator:"LogicalOperator"
	},
	ProductVariantFilterParameter:{
		facetValueId:"IDOperators",
		enabled:"BooleanOperators",
		trackInventory:"StringOperators",
		stockOnHand:"NumberOperators",
		stockAllocated:"NumberOperators",
		outOfStockThreshold:"NumberOperators",
		useGlobalOutOfStockThreshold:"BooleanOperators",
		id:"IDOperators",
		productId:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		languageCode:"StringOperators",
		sku:"StringOperators",
		name:"StringOperators",
		price:"NumberOperators",
		currencyCode:"StringOperators",
		priceWithTax:"NumberOperators",
		stockLevel:"StringOperators",
		_and:"ProductVariantFilterParameter",
		_or:"ProductVariantFilterParameter"
	},
	ProductTranslationInput:{
		languageCode:"LanguageCode",
		customFields:"JSON"
	},
	CreateProductInput:{
		translations:"ProductTranslationInput",
		customFields:"JSON"
	},
	UpdateProductInput:{
		translations:"ProductTranslationInput",
		customFields:"JSON"
	},
	ProductVariantTranslationInput:{
		languageCode:"LanguageCode",
		customFields:"JSON"
	},
	CreateProductVariantOptionInput:{
		translations:"ProductOptionTranslationInput"
	},
	StockLevelInput:{

	},
	ProductVariantPriceInput:{
		currencyCode:"CurrencyCode",
		price:"Money"
	},
	CreateProductVariantInput:{
		translations:"ProductVariantTranslationInput",
		price:"Money",
		stockLevels:"StockLevelInput",
		trackInventory:"GlobalFlag",
		customFields:"JSON"
	},
	UpdateProductVariantInput:{
		translations:"ProductVariantTranslationInput",
		price:"Money",
		prices:"ProductVariantPriceInput",
		stockLevels:"StockLevelInput",
		trackInventory:"GlobalFlag",
		customFields:"JSON"
	},
	AssignProductsToChannelInput:{

	},
	RemoveProductsFromChannelInput:{

	},
	AssignProductVariantsToChannelInput:{

	},
	RemoveProductVariantsFromChannelInput:{

	},
	PromotionListOptions:{
		sort:"PromotionSortParameter",
		filter:"PromotionFilterParameter",
		filterOperator:"LogicalOperator"
	},
	PromotionTranslationInput:{
		languageCode:"LanguageCode",
		customFields:"JSON"
	},
	CreatePromotionInput:{
		startsAt:"DateTime",
		endsAt:"DateTime",
		conditions:"ConfigurableOperationInput",
		actions:"ConfigurableOperationInput",
		translations:"PromotionTranslationInput",
		customFields:"JSON"
	},
	UpdatePromotionInput:{
		startsAt:"DateTime",
		endsAt:"DateTime",
		conditions:"ConfigurableOperationInput",
		actions:"ConfigurableOperationInput",
		translations:"PromotionTranslationInput",
		customFields:"JSON"
	},
	AssignPromotionsToChannelInput:{

	},
	RemovePromotionsFromChannelInput:{

	},
	ProvinceTranslationInput:{
		languageCode:"LanguageCode",
		customFields:"JSON"
	},
	CreateProvinceInput:{
		translations:"ProvinceTranslationInput",
		customFields:"JSON"
	},
	UpdateProvinceInput:{
		translations:"ProvinceTranslationInput",
		customFields:"JSON"
	},
	ProvinceListOptions:{
		sort:"ProvinceSortParameter",
		filter:"ProvinceFilterParameter",
		filterOperator:"LogicalOperator"
	},
	RoleListOptions:{
		sort:"RoleSortParameter",
		filter:"RoleFilterParameter",
		filterOperator:"LogicalOperator"
	},
	CreateRoleInput:{
		permissions:"Permission"
	},
	UpdateRoleInput:{
		permissions:"Permission"
	},
	SellerListOptions:{
		sort:"SellerSortParameter",
		filter:"SellerFilterParameter",
		filterOperator:"LogicalOperator"
	},
	CreateSellerInput:{
		customFields:"JSON"
	},
	UpdateSellerInput:{
		customFields:"JSON"
	},
	ShippingMethodListOptions:{
		sort:"ShippingMethodSortParameter",
		filter:"ShippingMethodFilterParameter",
		filterOperator:"LogicalOperator"
	},
	ShippingMethodTranslationInput:{
		languageCode:"LanguageCode",
		customFields:"JSON"
	},
	CreateShippingMethodInput:{
		checker:"ConfigurableOperationInput",
		calculator:"ConfigurableOperationInput",
		translations:"ShippingMethodTranslationInput",
		customFields:"JSON"
	},
	UpdateShippingMethodInput:{
		checker:"ConfigurableOperationInput",
		calculator:"ConfigurableOperationInput",
		translations:"ShippingMethodTranslationInput",
		customFields:"JSON"
	},
	TestShippingMethodInput:{
		checker:"ConfigurableOperationInput",
		calculator:"ConfigurableOperationInput",
		shippingAddress:"CreateAddressInput",
		lines:"TestShippingMethodOrderLineInput"
	},
	TestEligibleShippingMethodsInput:{
		shippingAddress:"CreateAddressInput",
		lines:"TestShippingMethodOrderLineInput"
	},
	TestShippingMethodOrderLineInput:{

	},
	AssignShippingMethodsToChannelInput:{

	},
	RemoveShippingMethodsFromChannelInput:{

	},
	StockLocationListOptions:{
		sort:"StockLocationSortParameter",
		filter:"StockLocationFilterParameter",
		filterOperator:"LogicalOperator"
	},
	CreateStockLocationInput:{
		customFields:"JSON"
	},
	UpdateStockLocationInput:{
		customFields:"JSON"
	},
	DeleteStockLocationInput:{

	},
	AssignStockLocationsToChannelInput:{

	},
	RemoveStockLocationsFromChannelInput:{

	},
	StockMovementType: "enum" as const,
	TagListOptions:{
		sort:"TagSortParameter",
		filter:"TagFilterParameter",
		filterOperator:"LogicalOperator"
	},
	CreateTagInput:{

	},
	UpdateTagInput:{

	},
	TaxCategoryListOptions:{
		sort:"TaxCategorySortParameter",
		filter:"TaxCategoryFilterParameter",
		filterOperator:"LogicalOperator"
	},
	CreateTaxCategoryInput:{
		customFields:"JSON"
	},
	UpdateTaxCategoryInput:{
		customFields:"JSON"
	},
	TaxRateListOptions:{
		sort:"TaxRateSortParameter",
		filter:"TaxRateFilterParameter",
		filterOperator:"LogicalOperator"
	},
	CreateTaxRateInput:{
		customFields:"JSON"
	},
	UpdateTaxRateInput:{
		customFields:"JSON"
	},
	ZoneListOptions:{
		sort:"ZoneSortParameter",
		filter:"ZoneFilterParameter",
		filterOperator:"LogicalOperator"
	},
	CreateZoneInput:{
		customFields:"JSON"
	},
	UpdateZoneInput:{
		customFields:"JSON"
	},
	AssetType: "enum" as const,
	GlobalFlag: "enum" as const,
	AdjustmentType: "enum" as const,
	DeletionResult: "enum" as const,
	Permission: "enum" as const,
	SortOrder: "enum" as const,
	ErrorCode: "enum" as const,
	LogicalOperator: "enum" as const,
	JSON: `scalar.JSON` as const,
	DateTime: `scalar.DateTime` as const,
	Upload: `scalar.Upload` as const,
	Money: `scalar.Money` as const,
	ConfigArgInput:{

	},
	ConfigurableOperationInput:{
		arguments:"ConfigArgInput"
	},
	StringOperators:{

	},
	IDOperators:{

	},
	BooleanOperators:{

	},
	NumberRange:{

	},
	NumberOperators:{
		between:"NumberRange"
	},
	DateRange:{
		start:"DateTime",
		end:"DateTime"
	},
	DateOperators:{
		eq:"DateTime",
		before:"DateTime",
		after:"DateTime",
		between:"DateRange"
	},
	StringListOperators:{

	},
	NumberListOperators:{

	},
	BooleanListOperators:{

	},
	IDListOperators:{

	},
	DateListOperators:{
		inList:"DateTime"
	},
	FacetValueFilterInput:{

	},
	SearchInput:{
		facetValueFilters:"FacetValueFilterInput",
		sort:"SearchResultSortParameter"
	},
	SearchResultSortParameter:{
		name:"SortOrder",
		price:"SortOrder"
	},
	CreateCustomerInput:{
		customFields:"JSON"
	},
	CreateAddressInput:{
		customFields:"JSON"
	},
	UpdateAddressInput:{
		customFields:"JSON"
	},
	CurrencyCode: "enum" as const,
	CustomerGroup:{
		customers:{
			options:"CustomerListOptions"
		}
	},
	FacetValueListOptions:{
		sort:"FacetValueSortParameter",
		filter:"FacetValueFilterParameter",
		filterOperator:"LogicalOperator"
	},
	HistoryEntryType: "enum" as const,
	HistoryEntryListOptions:{
		sort:"HistoryEntrySortParameter",
		filter:"HistoryEntryFilterParameter",
		filterOperator:"LogicalOperator"
	},
	LanguageCode: "enum" as const,
	OrderType: "enum" as const,
	MetricInterval: "enum" as const,
	MetricType: "enum" as const,
	MetricSummaryInput:{
		interval:"MetricInterval",
		types:"MetricType"
	},
	AdministratorFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		firstName:"StringOperators",
		lastName:"StringOperators",
		emailAddress:"StringOperators",
		_and:"AdministratorFilterParameter",
		_or:"AdministratorFilterParameter"
	},
	AdministratorSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		firstName:"SortOrder",
		lastName:"SortOrder",
		emailAddress:"SortOrder"
	},
	AssetFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		name:"StringOperators",
		type:"StringOperators",
		fileSize:"NumberOperators",
		mimeType:"StringOperators",
		width:"NumberOperators",
		height:"NumberOperators",
		source:"StringOperators",
		preview:"StringOperators",
		_and:"AssetFilterParameter",
		_or:"AssetFilterParameter"
	},
	AssetSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		name:"SortOrder",
		fileSize:"SortOrder",
		mimeType:"SortOrder",
		width:"SortOrder",
		height:"SortOrder",
		source:"SortOrder",
		preview:"SortOrder"
	},
	ChannelFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		code:"StringOperators",
		token:"StringOperators",
		defaultLanguageCode:"StringOperators",
		currencyCode:"StringOperators",
		defaultCurrencyCode:"StringOperators",
		trackInventory:"BooleanOperators",
		outOfStockThreshold:"NumberOperators",
		pricesIncludeTax:"BooleanOperators",
		_and:"ChannelFilterParameter",
		_or:"ChannelFilterParameter"
	},
	ChannelSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		code:"SortOrder",
		token:"SortOrder",
		outOfStockThreshold:"SortOrder"
	},
	CollectionFilterParameter:{
		isPrivate:"BooleanOperators",
		inheritFilters:"BooleanOperators",
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		languageCode:"StringOperators",
		name:"StringOperators",
		slug:"StringOperators",
		position:"NumberOperators",
		description:"StringOperators",
		parentId:"IDOperators",
		_and:"CollectionFilterParameter",
		_or:"CollectionFilterParameter"
	},
	CollectionSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		name:"SortOrder",
		slug:"SortOrder",
		position:"SortOrder",
		description:"SortOrder",
		parentId:"SortOrder"
	},
	ProductVariantSortParameter:{
		stockOnHand:"SortOrder",
		stockAllocated:"SortOrder",
		outOfStockThreshold:"SortOrder",
		id:"SortOrder",
		productId:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		sku:"SortOrder",
		name:"SortOrder",
		price:"SortOrder",
		priceWithTax:"SortOrder",
		stockLevel:"SortOrder"
	},
	CountryFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		languageCode:"StringOperators",
		code:"StringOperators",
		type:"StringOperators",
		name:"StringOperators",
		enabled:"BooleanOperators",
		parentId:"IDOperators",
		_and:"CountryFilterParameter",
		_or:"CountryFilterParameter"
	},
	CountrySortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		code:"SortOrder",
		type:"SortOrder",
		name:"SortOrder",
		parentId:"SortOrder"
	},
	CustomerGroupFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		name:"StringOperators",
		_and:"CustomerGroupFilterParameter",
		_or:"CustomerGroupFilterParameter"
	},
	CustomerGroupSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		name:"SortOrder"
	},
	CustomerSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		title:"SortOrder",
		firstName:"SortOrder",
		lastName:"SortOrder",
		phoneNumber:"SortOrder",
		emailAddress:"SortOrder"
	},
	FacetFilterParameter:{
		isPrivate:"BooleanOperators",
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		languageCode:"StringOperators",
		name:"StringOperators",
		code:"StringOperators",
		_and:"FacetFilterParameter",
		_or:"FacetFilterParameter"
	},
	FacetSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		name:"SortOrder",
		code:"SortOrder"
	},
	FacetValueFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		languageCode:"StringOperators",
		facetId:"IDOperators",
		name:"StringOperators",
		code:"StringOperators",
		_and:"FacetValueFilterParameter",
		_or:"FacetValueFilterParameter"
	},
	FacetValueSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		facetId:"SortOrder",
		name:"SortOrder",
		code:"SortOrder"
	},
	JobFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		startedAt:"DateOperators",
		settledAt:"DateOperators",
		queueName:"StringOperators",
		state:"StringOperators",
		progress:"NumberOperators",
		isSettled:"BooleanOperators",
		duration:"NumberOperators",
		retries:"NumberOperators",
		attempts:"NumberOperators",
		_and:"JobFilterParameter",
		_or:"JobFilterParameter"
	},
	JobSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		startedAt:"SortOrder",
		settledAt:"SortOrder",
		queueName:"SortOrder",
		progress:"SortOrder",
		duration:"SortOrder",
		retries:"SortOrder",
		attempts:"SortOrder"
	},
	PaymentMethodFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		name:"StringOperators",
		code:"StringOperators",
		description:"StringOperators",
		enabled:"BooleanOperators",
		_and:"PaymentMethodFilterParameter",
		_or:"PaymentMethodFilterParameter"
	},
	PaymentMethodSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		name:"SortOrder",
		code:"SortOrder",
		description:"SortOrder"
	},
	ProductSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		name:"SortOrder",
		slug:"SortOrder",
		description:"SortOrder"
	},
	PromotionFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		startsAt:"DateOperators",
		endsAt:"DateOperators",
		couponCode:"StringOperators",
		perCustomerUsageLimit:"NumberOperators",
		usageLimit:"NumberOperators",
		name:"StringOperators",
		description:"StringOperators",
		enabled:"BooleanOperators",
		_and:"PromotionFilterParameter",
		_or:"PromotionFilterParameter"
	},
	PromotionSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		startsAt:"SortOrder",
		endsAt:"SortOrder",
		couponCode:"SortOrder",
		perCustomerUsageLimit:"SortOrder",
		usageLimit:"SortOrder",
		name:"SortOrder",
		description:"SortOrder"
	},
	ProvinceFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		languageCode:"StringOperators",
		code:"StringOperators",
		type:"StringOperators",
		name:"StringOperators",
		enabled:"BooleanOperators",
		parentId:"IDOperators",
		_and:"ProvinceFilterParameter",
		_or:"ProvinceFilterParameter"
	},
	ProvinceSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		code:"SortOrder",
		type:"SortOrder",
		name:"SortOrder",
		parentId:"SortOrder"
	},
	RoleFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		code:"StringOperators",
		description:"StringOperators",
		_and:"RoleFilterParameter",
		_or:"RoleFilterParameter"
	},
	RoleSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		code:"SortOrder",
		description:"SortOrder"
	},
	SellerFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		name:"StringOperators",
		_and:"SellerFilterParameter",
		_or:"SellerFilterParameter"
	},
	SellerSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		name:"SortOrder"
	},
	ShippingMethodFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		languageCode:"StringOperators",
		code:"StringOperators",
		name:"StringOperators",
		description:"StringOperators",
		fulfillmentHandlerCode:"StringOperators",
		_and:"ShippingMethodFilterParameter",
		_or:"ShippingMethodFilterParameter"
	},
	ShippingMethodSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		code:"SortOrder",
		name:"SortOrder",
		description:"SortOrder",
		fulfillmentHandlerCode:"SortOrder"
	},
	StockLocationFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		name:"StringOperators",
		description:"StringOperators",
		_and:"StockLocationFilterParameter",
		_or:"StockLocationFilterParameter"
	},
	StockLocationSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		name:"SortOrder",
		description:"SortOrder"
	},
	TagFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		value:"StringOperators",
		_and:"TagFilterParameter",
		_or:"TagFilterParameter"
	},
	TagSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		value:"SortOrder"
	},
	TaxCategoryFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		name:"StringOperators",
		isDefault:"BooleanOperators",
		_and:"TaxCategoryFilterParameter",
		_or:"TaxCategoryFilterParameter"
	},
	TaxCategorySortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		name:"SortOrder"
	},
	TaxRateFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		name:"StringOperators",
		enabled:"BooleanOperators",
		value:"NumberOperators",
		_and:"TaxRateFilterParameter",
		_or:"TaxRateFilterParameter"
	},
	TaxRateSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		name:"SortOrder",
		value:"SortOrder"
	},
	ZoneFilterParameter:{
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		name:"StringOperators",
		_and:"ZoneFilterParameter",
		_or:"ZoneFilterParameter"
	},
	ZoneSortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder",
		name:"SortOrder"
	},
	HistoryEntryFilterParameter:{
		isPublic:"BooleanOperators",
		id:"IDOperators",
		createdAt:"DateOperators",
		updatedAt:"DateOperators",
		type:"StringOperators",
		_and:"HistoryEntryFilterParameter",
		_or:"HistoryEntryFilterParameter"
	},
	HistoryEntrySortParameter:{
		id:"SortOrder",
		createdAt:"SortOrder",
		updatedAt:"SortOrder"
	},
	OrderLineCustomFieldsInput:{
		datetimeExample:"DateTime",
		datetimeExampleList:"DateTime"
	},
	NativeAuthInput:{

	}
}

export const ReturnTypes: Record<string,any> = {
	Query:{
		administrators:"AdministratorList",
		administrator:"Administrator",
		activeAdministrator:"Administrator",
		assets:"AssetList",
		asset:"Asset",
		me:"CurrentUser",
		channels:"ChannelList",
		channel:"Channel",
		activeChannel:"Channel",
		collections:"CollectionList",
		collection:"Collection",
		collectionFilters:"ConfigurableOperationDefinition",
		previewCollectionVariants:"ProductVariantList",
		countries:"CountryList",
		country:"Country",
		customerGroups:"CustomerGroupList",
		customerGroup:"CustomerGroup",
		customers:"CustomerList",
		customer:"Customer",
		entityDuplicators:"EntityDuplicatorDefinition",
		facets:"FacetList",
		facet:"Facet",
		facetValues:"FacetValueList",
		globalSettings:"GlobalSettings",
		job:"Job",
		jobs:"JobList",
		jobsById:"Job",
		jobQueues:"JobQueue",
		jobBufferSize:"JobBufferSize",
		order:"Order",
		orders:"OrderList",
		eligibleShippingMethodsForDraftOrder:"ShippingMethodQuote",
		paymentMethods:"PaymentMethodList",
		paymentMethod:"PaymentMethod",
		paymentMethodEligibilityCheckers:"ConfigurableOperationDefinition",
		paymentMethodHandlers:"ConfigurableOperationDefinition",
		productOptionGroups:"ProductOptionGroup",
		productOptionGroup:"ProductOptionGroup",
		search:"SearchResponse",
		pendingSearchIndexUpdates:"Int",
		products:"ProductList",
		product:"Product",
		productVariants:"ProductVariantList",
		productVariant:"ProductVariant",
		promotion:"Promotion",
		promotions:"PromotionList",
		promotionConditions:"ConfigurableOperationDefinition",
		promotionActions:"ConfigurableOperationDefinition",
		provinces:"ProvinceList",
		province:"Province",
		roles:"RoleList",
		role:"Role",
		sellers:"SellerList",
		seller:"Seller",
		shippingMethods:"ShippingMethodList",
		shippingMethod:"ShippingMethod",
		shippingEligibilityCheckers:"ConfigurableOperationDefinition",
		shippingCalculators:"ConfigurableOperationDefinition",
		fulfillmentHandlers:"ConfigurableOperationDefinition",
		testShippingMethod:"TestShippingMethodResult",
		testEligibleShippingMethods:"ShippingMethodQuote",
		stockLocation:"StockLocation",
		stockLocations:"StockLocationList",
		tag:"Tag",
		tags:"TagList",
		taxCategories:"TaxCategoryList",
		taxCategory:"TaxCategory",
		taxRates:"TaxRateList",
		taxRate:"TaxRate",
		zones:"ZoneList",
		zone:"Zone",
		metricSummary:"MetricSummary"
	},
	Mutation:{
		createAdministrator:"Administrator",
		updateAdministrator:"Administrator",
		updateActiveAdministrator:"Administrator",
		deleteAdministrator:"DeletionResponse",
		deleteAdministrators:"DeletionResponse",
		assignRoleToAdministrator:"Administrator",
		createAssets:"CreateAssetResult",
		updateAsset:"Asset",
		deleteAsset:"DeletionResponse",
		deleteAssets:"DeletionResponse",
		assignAssetsToChannel:"Asset",
		login:"NativeAuthenticationResult",
		authenticate:"AuthenticationResult",
		logout:"Success",
		createChannel:"CreateChannelResult",
		updateChannel:"UpdateChannelResult",
		deleteChannel:"DeletionResponse",
		deleteChannels:"DeletionResponse",
		createCollection:"Collection",
		updateCollection:"Collection",
		deleteCollection:"DeletionResponse",
		deleteCollections:"DeletionResponse",
		moveCollection:"Collection",
		assignCollectionsToChannel:"Collection",
		removeCollectionsFromChannel:"Collection",
		createCountry:"Country",
		updateCountry:"Country",
		deleteCountry:"DeletionResponse",
		deleteCountries:"DeletionResponse",
		createCustomerGroup:"CustomerGroup",
		updateCustomerGroup:"CustomerGroup",
		deleteCustomerGroup:"DeletionResponse",
		deleteCustomerGroups:"DeletionResponse",
		addCustomersToGroup:"CustomerGroup",
		removeCustomersFromGroup:"CustomerGroup",
		createCustomer:"CreateCustomerResult",
		updateCustomer:"UpdateCustomerResult",
		deleteCustomer:"DeletionResponse",
		deleteCustomers:"DeletionResponse",
		createCustomerAddress:"Address",
		updateCustomerAddress:"Address",
		deleteCustomerAddress:"Success",
		addNoteToCustomer:"Customer",
		updateCustomerNote:"HistoryEntry",
		deleteCustomerNote:"DeletionResponse",
		duplicateEntity:"DuplicateEntityResult",
		createFacet:"Facet",
		updateFacet:"Facet",
		deleteFacet:"DeletionResponse",
		deleteFacets:"DeletionResponse",
		createFacetValues:"FacetValue",
		updateFacetValues:"FacetValue",
		deleteFacetValues:"DeletionResponse",
		assignFacetsToChannel:"Facet",
		removeFacetsFromChannel:"RemoveFacetFromChannelResult",
		updateGlobalSettings:"UpdateGlobalSettingsResult",
		importProducts:"ImportInfo",
		removeSettledJobs:"Int",
		cancelJob:"Job",
		flushBufferedJobs:"Success",
		settlePayment:"SettlePaymentResult",
		cancelPayment:"CancelPaymentResult",
		addFulfillmentToOrder:"AddFulfillmentToOrderResult",
		cancelOrder:"CancelOrderResult",
		refundOrder:"RefundOrderResult",
		settleRefund:"SettleRefundResult",
		addNoteToOrder:"Order",
		updateOrderNote:"HistoryEntry",
		deleteOrderNote:"DeletionResponse",
		transitionOrderToState:"TransitionOrderToStateResult",
		transitionFulfillmentToState:"TransitionFulfillmentToStateResult",
		transitionPaymentToState:"TransitionPaymentToStateResult",
		setOrderCustomFields:"Order",
		setOrderCustomer:"Order",
		modifyOrder:"ModifyOrderResult",
		addManualPaymentToOrder:"AddManualPaymentToOrderResult",
		createDraftOrder:"Order",
		deleteDraftOrder:"DeletionResponse",
		addItemToDraftOrder:"UpdateOrderItemsResult",
		adjustDraftOrderLine:"UpdateOrderItemsResult",
		removeDraftOrderLine:"RemoveOrderItemsResult",
		setCustomerForDraftOrder:"SetCustomerForDraftOrderResult",
		setDraftOrderShippingAddress:"Order",
		setDraftOrderBillingAddress:"Order",
		setDraftOrderCustomFields:"Order",
		applyCouponCodeToDraftOrder:"ApplyCouponCodeResult",
		removeCouponCodeFromDraftOrder:"Order",
		setDraftOrderShippingMethod:"SetOrderShippingMethodResult",
		createPaymentMethod:"PaymentMethod",
		updatePaymentMethod:"PaymentMethod",
		deletePaymentMethod:"DeletionResponse",
		deletePaymentMethods:"DeletionResponse",
		assignPaymentMethodsToChannel:"PaymentMethod",
		removePaymentMethodsFromChannel:"PaymentMethod",
		createProductOptionGroup:"ProductOptionGroup",
		updateProductOptionGroup:"ProductOptionGroup",
		createProductOption:"ProductOption",
		updateProductOption:"ProductOption",
		deleteProductOption:"DeletionResponse",
		reindex:"Job",
		runPendingSearchIndexUpdates:"Success",
		createProduct:"Product",
		updateProduct:"Product",
		updateProducts:"Product",
		deleteProduct:"DeletionResponse",
		deleteProducts:"DeletionResponse",
		addOptionGroupToProduct:"Product",
		removeOptionGroupFromProduct:"RemoveOptionGroupFromProductResult",
		createProductVariants:"ProductVariant",
		updateProductVariants:"ProductVariant",
		deleteProductVariant:"DeletionResponse",
		deleteProductVariants:"DeletionResponse",
		assignProductsToChannel:"Product",
		removeProductsFromChannel:"Product",
		assignProductVariantsToChannel:"ProductVariant",
		removeProductVariantsFromChannel:"ProductVariant",
		createPromotion:"CreatePromotionResult",
		updatePromotion:"UpdatePromotionResult",
		deletePromotion:"DeletionResponse",
		deletePromotions:"DeletionResponse",
		assignPromotionsToChannel:"Promotion",
		removePromotionsFromChannel:"Promotion",
		createProvince:"Province",
		updateProvince:"Province",
		deleteProvince:"DeletionResponse",
		createRole:"Role",
		updateRole:"Role",
		deleteRole:"DeletionResponse",
		deleteRoles:"DeletionResponse",
		createSeller:"Seller",
		updateSeller:"Seller",
		deleteSeller:"DeletionResponse",
		deleteSellers:"DeletionResponse",
		createShippingMethod:"ShippingMethod",
		updateShippingMethod:"ShippingMethod",
		deleteShippingMethod:"DeletionResponse",
		deleteShippingMethods:"DeletionResponse",
		assignShippingMethodsToChannel:"ShippingMethod",
		removeShippingMethodsFromChannel:"ShippingMethod",
		createStockLocation:"StockLocation",
		updateStockLocation:"StockLocation",
		deleteStockLocation:"DeletionResponse",
		deleteStockLocations:"DeletionResponse",
		assignStockLocationsToChannel:"StockLocation",
		removeStockLocationsFromChannel:"StockLocation",
		createTag:"Tag",
		updateTag:"Tag",
		deleteTag:"DeletionResponse",
		createTaxCategory:"TaxCategory",
		updateTaxCategory:"TaxCategory",
		deleteTaxCategory:"DeletionResponse",
		deleteTaxCategories:"DeletionResponse",
		createTaxRate:"TaxRate",
		updateTaxRate:"TaxRate",
		deleteTaxRate:"DeletionResponse",
		deleteTaxRates:"DeletionResponse",
		createZone:"Zone",
		updateZone:"Zone",
		deleteZone:"DeletionResponse",
		deleteZones:"DeletionResponse",
		addMembersToZone:"Zone",
		removeMembersFromZone:"Zone"
	},
	Administrator:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		firstName:"String",
		lastName:"String",
		emailAddress:"String",
		user:"User",
		customFields:"JSON"
	},
	AdministratorList:{
		items:"Administrator",
		totalItems:"Int"
	},
	MimeTypeError:{
		errorCode:"ErrorCode",
		message:"String",
		fileName:"String",
		mimeType:"String"
	},
	CreateAssetResult:{
		"...on Asset":"Asset",
		"...on MimeTypeError":"MimeTypeError"
	},
	NativeAuthenticationResult:{
		"...on CurrentUser":"CurrentUser",
		"...on InvalidCredentialsError":"InvalidCredentialsError",
		"...on NativeAuthStrategyError":"NativeAuthStrategyError"
	},
	AuthenticationResult:{
		"...on CurrentUser":"CurrentUser",
		"...on InvalidCredentialsError":"InvalidCredentialsError"
	},
	ChannelList:{
		items:"Channel",
		totalItems:"Int"
	},
	LanguageNotAvailableError:{
		errorCode:"ErrorCode",
		message:"String",
		languageCode:"String"
	},
	CreateChannelResult:{
		"...on Channel":"Channel",
		"...on LanguageNotAvailableError":"LanguageNotAvailableError"
	},
	UpdateChannelResult:{
		"...on Channel":"Channel",
		"...on LanguageNotAvailableError":"LanguageNotAvailableError"
	},
	Collection:{
		isPrivate:"Boolean",
		inheritFilters:"Boolean",
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		name:"String",
		slug:"String",
		breadcrumbs:"CollectionBreadcrumb",
		position:"Int",
		description:"String",
		featuredAsset:"Asset",
		assets:"Asset",
		parent:"Collection",
		parentId:"ID",
		children:"Collection",
		filters:"ConfigurableOperation",
		translations:"CollectionTranslation",
		productVariants:"ProductVariantList",
		customFields:"JSON"
	},
	Customer:{
		groups:"CustomerGroup",
		history:"HistoryEntryList",
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		title:"String",
		firstName:"String",
		lastName:"String",
		phoneNumber:"String",
		emailAddress:"String",
		addresses:"Address",
		orders:"OrderList",
		user:"User",
		customFields:"JSON"
	},
	CustomerGroupList:{
		items:"CustomerGroup",
		totalItems:"Int"
	},
	CreateCustomerResult:{
		"...on Customer":"Customer",
		"...on EmailAddressConflictError":"EmailAddressConflictError"
	},
	UpdateCustomerResult:{
		"...on Customer":"Customer",
		"...on EmailAddressConflictError":"EmailAddressConflictError"
	},
	EntityDuplicatorDefinition:{
		code:"String",
		args:"ConfigArgDefinition",
		description:"String",
		forEntities:"String",
		requiresPermission:"Permission"
	},
	DuplicateEntitySuccess:{
		newEntityId:"ID"
	},
	DuplicateEntityError:{
		errorCode:"ErrorCode",
		message:"String",
		duplicationError:"String"
	},
	DuplicateEntityResult:{
		"...on DuplicateEntitySuccess":"DuplicateEntitySuccess",
		"...on DuplicateEntityError":"DuplicateEntityError"
	},
	Facet:{
		isPrivate:"Boolean",
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		name:"String",
		code:"String",
		values:"FacetValue",
		valueList:"FacetValueList",
		translations:"FacetTranslation",
		customFields:"JSON"
	},
	FacetInUseError:{
		errorCode:"ErrorCode",
		message:"String",
		facetCode:"String",
		productCount:"Int",
		variantCount:"Int"
	},
	RemoveFacetFromChannelResult:{
		"...on Facet":"Facet",
		"...on FacetInUseError":"FacetInUseError"
	},
	ChannelDefaultLanguageError:{
		errorCode:"ErrorCode",
		message:"String",
		language:"String",
		channelCode:"String"
	},
	UpdateGlobalSettingsResult:{
		"...on GlobalSettings":"GlobalSettings",
		"...on ChannelDefaultLanguageError":"ChannelDefaultLanguageError"
	},
	GlobalSettings:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		availableLanguages:"LanguageCode",
		trackInventory:"Boolean",
		outOfStockThreshold:"Int",
		serverConfig:"ServerConfig",
		customFields:"JSON"
	},
	OrderProcessState:{
		name:"String",
		to:"String"
	},
	PermissionDefinition:{
		name:"String",
		description:"String",
		assignable:"Boolean"
	},
	ServerConfig:{
		orderProcess:"OrderProcessState",
		permittedAssetTypes:"String",
		permissions:"PermissionDefinition",
		moneyStrategyPrecision:"Int",
		customFieldConfig:"CustomFields",
		entityCustomFields:"EntityCustomFields"
	},
	HistoryEntry:{
		isPublic:"Boolean",
		administrator:"Administrator",
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		type:"HistoryEntryType",
		data:"JSON"
	},
	ImportInfo:{
		errors:"String",
		processed:"Int",
		imported:"Int"
	},
	JobBufferSize:{
		bufferId:"String",
		size:"Int"
	},
	JobList:{
		items:"Job",
		totalItems:"Int"
	},
	Job:{
		id:"ID",
		createdAt:"DateTime",
		startedAt:"DateTime",
		settledAt:"DateTime",
		queueName:"String",
		state:"JobState",
		progress:"Float",
		data:"JSON",
		result:"JSON",
		error:"JSON",
		isSettled:"Boolean",
		duration:"Int",
		retries:"Int",
		attempts:"Int"
	},
	JobQueue:{
		name:"String",
		running:"Boolean"
	},
	Order:{
		nextStates:"String",
		modifications:"OrderModification",
		sellerOrders:"Order",
		aggregateOrder:"Order",
		aggregateOrderId:"ID",
		channels:"Channel",
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		type:"OrderType",
		orderPlacedAt:"DateTime",
		code:"String",
		state:"String",
		active:"Boolean",
		customer:"Customer",
		shippingAddress:"OrderAddress",
		billingAddress:"OrderAddress",
		lines:"OrderLine",
		surcharges:"Surcharge",
		discounts:"Discount",
		couponCodes:"String",
		promotions:"Promotion",
		payments:"Payment",
		fulfillments:"Fulfillment",
		totalQuantity:"Int",
		subTotal:"Money",
		subTotalWithTax:"Money",
		currencyCode:"CurrencyCode",
		shippingLines:"ShippingLine",
		shipping:"Money",
		shippingWithTax:"Money",
		total:"Money",
		totalWithTax:"Money",
		taxSummary:"OrderTaxSummary",
		history:"HistoryEntryList",
		customFields:"JSON"
	},
	Fulfillment:{
		nextStates:"String",
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		lines:"FulfillmentLine",
		summary:"FulfillmentLine",
		state:"String",
		method:"String",
		trackingCode:"String",
		customFields:"JSON"
	},
	Payment:{
		nextStates:"String",
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		method:"String",
		amount:"Money",
		state:"String",
		transactionId:"String",
		errorMessage:"String",
		refunds:"Refund",
		metadata:"JSON"
	},
	OrderModificationLine:{
		orderLine:"OrderLine",
		orderLineId:"ID",
		quantity:"Int",
		modification:"OrderModification",
		modificationId:"ID"
	},
	OrderModification:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		priceChange:"Money",
		note:"String",
		lines:"OrderModificationLine",
		surcharges:"Surcharge",
		payment:"Payment",
		refund:"Refund",
		isSettled:"Boolean"
	},
	SettlePaymentError:{
		errorCode:"ErrorCode",
		message:"String",
		paymentErrorMessage:"String"
	},
	CancelPaymentError:{
		errorCode:"ErrorCode",
		message:"String",
		paymentErrorMessage:"String"
	},
	EmptyOrderLineSelectionError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	ItemsAlreadyFulfilledError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	InvalidFulfillmentHandlerError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	CreateFulfillmentError:{
		errorCode:"ErrorCode",
		message:"String",
		fulfillmentHandlerError:"String"
	},
	InsufficientStockOnHandError:{
		errorCode:"ErrorCode",
		message:"String",
		productVariantId:"ID",
		productVariantName:"String",
		stockOnHand:"Int"
	},
	MultipleOrderError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	CancelActiveOrderError:{
		errorCode:"ErrorCode",
		message:"String",
		orderState:"String"
	},
	PaymentOrderMismatchError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	RefundOrderStateError:{
		errorCode:"ErrorCode",
		message:"String",
		orderState:"String"
	},
	NothingToRefundError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	AlreadyRefundedError:{
		errorCode:"ErrorCode",
		message:"String",
		refundId:"ID"
	},
	QuantityTooGreatError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	RefundAmountError:{
		errorCode:"ErrorCode",
		message:"String",
		maximumRefundable:"Int"
	},
	RefundStateTransitionError:{
		errorCode:"ErrorCode",
		message:"String",
		transitionError:"String",
		fromState:"String",
		toState:"String"
	},
	PaymentStateTransitionError:{
		errorCode:"ErrorCode",
		message:"String",
		transitionError:"String",
		fromState:"String",
		toState:"String"
	},
	FulfillmentStateTransitionError:{
		errorCode:"ErrorCode",
		message:"String",
		transitionError:"String",
		fromState:"String",
		toState:"String"
	},
	OrderModificationStateError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	NoChangesSpecifiedError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	PaymentMethodMissingError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	RefundPaymentIdMissingError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	ManualPaymentStateError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	TransitionOrderToStateResult:{
		"...on Order":"Order",
		"...on OrderStateTransitionError":"OrderStateTransitionError"
	},
	SettlePaymentResult:{
		"...on Payment":"Payment",
		"...on SettlePaymentError":"SettlePaymentError",
		"...on PaymentStateTransitionError":"PaymentStateTransitionError",
		"...on OrderStateTransitionError":"OrderStateTransitionError"
	},
	CancelPaymentResult:{
		"...on Payment":"Payment",
		"...on CancelPaymentError":"CancelPaymentError",
		"...on PaymentStateTransitionError":"PaymentStateTransitionError"
	},
	AddFulfillmentToOrderResult:{
		"...on Fulfillment":"Fulfillment",
		"...on EmptyOrderLineSelectionError":"EmptyOrderLineSelectionError",
		"...on ItemsAlreadyFulfilledError":"ItemsAlreadyFulfilledError",
		"...on InsufficientStockOnHandError":"InsufficientStockOnHandError",
		"...on InvalidFulfillmentHandlerError":"InvalidFulfillmentHandlerError",
		"...on FulfillmentStateTransitionError":"FulfillmentStateTransitionError",
		"...on CreateFulfillmentError":"CreateFulfillmentError"
	},
	CancelOrderResult:{
		"...on Order":"Order",
		"...on EmptyOrderLineSelectionError":"EmptyOrderLineSelectionError",
		"...on QuantityTooGreatError":"QuantityTooGreatError",
		"...on MultipleOrderError":"MultipleOrderError",
		"...on CancelActiveOrderError":"CancelActiveOrderError",
		"...on OrderStateTransitionError":"OrderStateTransitionError"
	},
	RefundOrderResult:{
		"...on Refund":"Refund",
		"...on QuantityTooGreatError":"QuantityTooGreatError",
		"...on NothingToRefundError":"NothingToRefundError",
		"...on OrderStateTransitionError":"OrderStateTransitionError",
		"...on MultipleOrderError":"MultipleOrderError",
		"...on PaymentOrderMismatchError":"PaymentOrderMismatchError",
		"...on RefundOrderStateError":"RefundOrderStateError",
		"...on AlreadyRefundedError":"AlreadyRefundedError",
		"...on RefundStateTransitionError":"RefundStateTransitionError",
		"...on RefundAmountError":"RefundAmountError"
	},
	SettleRefundResult:{
		"...on Refund":"Refund",
		"...on RefundStateTransitionError":"RefundStateTransitionError"
	},
	TransitionFulfillmentToStateResult:{
		"...on Fulfillment":"Fulfillment",
		"...on FulfillmentStateTransitionError":"FulfillmentStateTransitionError"
	},
	TransitionPaymentToStateResult:{
		"...on Payment":"Payment",
		"...on PaymentStateTransitionError":"PaymentStateTransitionError"
	},
	ModifyOrderResult:{
		"...on Order":"Order",
		"...on NoChangesSpecifiedError":"NoChangesSpecifiedError",
		"...on OrderModificationStateError":"OrderModificationStateError",
		"...on PaymentMethodMissingError":"PaymentMethodMissingError",
		"...on RefundPaymentIdMissingError":"RefundPaymentIdMissingError",
		"...on OrderLimitError":"OrderLimitError",
		"...on NegativeQuantityError":"NegativeQuantityError",
		"...on InsufficientStockError":"InsufficientStockError",
		"...on CouponCodeExpiredError":"CouponCodeExpiredError",
		"...on CouponCodeInvalidError":"CouponCodeInvalidError",
		"...on CouponCodeLimitError":"CouponCodeLimitError",
		"...on IneligibleShippingMethodError":"IneligibleShippingMethodError"
	},
	AddManualPaymentToOrderResult:{
		"...on Order":"Order",
		"...on ManualPaymentStateError":"ManualPaymentStateError"
	},
	SetCustomerForDraftOrderResult:{
		"...on Order":"Order",
		"...on EmailAddressConflictError":"EmailAddressConflictError"
	},
	PaymentMethodList:{
		items:"PaymentMethod",
		totalItems:"Int"
	},
	Product:{
		channels:"Channel",
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		name:"String",
		slug:"String",
		description:"String",
		enabled:"Boolean",
		featuredAsset:"Asset",
		assets:"Asset",
		variants:"ProductVariant",
		variantList:"ProductVariantList",
		optionGroups:"ProductOptionGroup",
		facetValues:"FacetValue",
		translations:"ProductTranslation",
		collections:"Collection",
		customFields:"JSON"
	},
	ProductVariantPrice:{
		currencyCode:"CurrencyCode",
		price:"Money",
		customFields:"JSON"
	},
	ProductVariant:{
		enabled:"Boolean",
		trackInventory:"GlobalFlag",
		stockOnHand:"Int",
		stockAllocated:"Int",
		outOfStockThreshold:"Int",
		useGlobalOutOfStockThreshold:"Boolean",
		prices:"ProductVariantPrice",
		stockLevels:"StockLevel",
		stockMovements:"StockMovementList",
		channels:"Channel",
		id:"ID",
		product:"Product",
		productId:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		sku:"String",
		name:"String",
		featuredAsset:"Asset",
		assets:"Asset",
		price:"Money",
		currencyCode:"CurrencyCode",
		priceWithTax:"Money",
		stockLevel:"String",
		taxRateApplied:"TaxRate",
		taxCategory:"TaxCategory",
		options:"ProductOption",
		facetValues:"FacetValue",
		translations:"ProductVariantTranslation",
		customFields:"JSON"
	},
	SearchResult:{
		enabled:"Boolean",
		channelIds:"ID",
		sku:"String",
		slug:"String",
		productId:"ID",
		productName:"String",
		productAsset:"SearchResultAsset",
		productVariantId:"ID",
		productVariantName:"String",
		productVariantAsset:"SearchResultAsset",
		price:"SearchResultPrice",
		priceWithTax:"SearchResultPrice",
		currencyCode:"CurrencyCode",
		description:"String",
		facetIds:"ID",
		facetValueIds:"ID",
		collectionIds:"ID",
		score:"Float",
		inStock:"Boolean"
	},
	ProductOptionInUseError:{
		errorCode:"ErrorCode",
		message:"String",
		optionGroupCode:"String",
		productVariantCount:"Int"
	},
	RemoveOptionGroupFromProductResult:{
		"...on Product":"Product",
		"...on ProductOptionInUseError":"ProductOptionInUseError"
	},
	MissingConditionsError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	CreatePromotionResult:{
		"...on Promotion":"Promotion",
		"...on MissingConditionsError":"MissingConditionsError"
	},
	UpdatePromotionResult:{
		"...on Promotion":"Promotion",
		"...on MissingConditionsError":"MissingConditionsError"
	},
	SellerList:{
		items:"Seller",
		totalItems:"Int"
	},
	TestShippingMethodResult:{
		eligible:"Boolean",
		quote:"TestShippingMethodQuote"
	},
	TestShippingMethodQuote:{
		price:"Money",
		priceWithTax:"Money",
		metadata:"JSON"
	},
	StockLevel:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		stockLocationId:"ID",
		stockOnHand:"Int",
		stockAllocated:"Int",
		stockLocation:"StockLocation"
	},
	StockLocationList:{
		items:"StockLocation",
		totalItems:"Int"
	},
	StockLocation:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		name:"String",
		description:"String",
		customFields:"JSON"
	},
	StockMovement:{
		"...on StockAdjustment": "StockAdjustment",
		"...on Allocation": "Allocation",
		"...on Sale": "Sale",
		"...on Cancellation": "Cancellation",
		"...on Return": "Return",
		"...on Release": "Release",
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		productVariant:"ProductVariant",
		type:"StockMovementType",
		quantity:"Int"
	},
	StockAdjustment:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		productVariant:"ProductVariant",
		type:"StockMovementType",
		quantity:"Int"
	},
	Allocation:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		productVariant:"ProductVariant",
		type:"StockMovementType",
		quantity:"Int",
		orderLine:"OrderLine"
	},
	Sale:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		productVariant:"ProductVariant",
		type:"StockMovementType",
		quantity:"Int"
	},
	Cancellation:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		productVariant:"ProductVariant",
		type:"StockMovementType",
		quantity:"Int",
		orderLine:"OrderLine"
	},
	Return:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		productVariant:"ProductVariant",
		type:"StockMovementType",
		quantity:"Int"
	},
	Release:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		productVariant:"ProductVariant",
		type:"StockMovementType",
		quantity:"Int"
	},
	StockMovementItem:{
		"...on StockAdjustment":"StockAdjustment",
		"...on Allocation":"Allocation",
		"...on Sale":"Sale",
		"...on Cancellation":"Cancellation",
		"...on Return":"Return",
		"...on Release":"Release"
	},
	StockMovementList:{
		items:"StockMovementItem",
		totalItems:"Int"
	},
	TaxCategoryList:{
		items:"TaxCategory",
		totalItems:"Int"
	},
	ZoneList:{
		items:"Zone",
		totalItems:"Int"
	},
	Address:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		fullName:"String",
		company:"String",
		streetLine1:"String",
		streetLine2:"String",
		city:"String",
		province:"String",
		postalCode:"String",
		country:"Country",
		phoneNumber:"String",
		defaultShippingAddress:"Boolean",
		defaultBillingAddress:"Boolean",
		customFields:"JSON"
	},
	Asset:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		name:"String",
		type:"AssetType",
		fileSize:"Int",
		mimeType:"String",
		width:"Int",
		height:"Int",
		source:"String",
		preview:"String",
		focalPoint:"Coordinate",
		tags:"Tag",
		customFields:"JSON"
	},
	Coordinate:{
		x:"Float",
		y:"Float"
	},
	AssetList:{
		items:"Asset",
		totalItems:"Int"
	},
	CurrentUser:{
		id:"ID",
		identifier:"String",
		channels:"CurrentUserChannel"
	},
	CurrentUserChannel:{
		id:"ID",
		token:"String",
		code:"String",
		permissions:"Permission"
	},
	Channel:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		code:"String",
		token:"String",
		defaultTaxZone:"Zone",
		defaultShippingZone:"Zone",
		defaultLanguageCode:"LanguageCode",
		availableLanguageCodes:"LanguageCode",
		currencyCode:"CurrencyCode",
		defaultCurrencyCode:"CurrencyCode",
		availableCurrencyCodes:"CurrencyCode",
		trackInventory:"Boolean",
		outOfStockThreshold:"Int",
		pricesIncludeTax:"Boolean",
		seller:"Seller",
		customFields:"JSON"
	},
	CollectionBreadcrumb:{
		id:"ID",
		name:"String",
		slug:"String"
	},
	CollectionTranslation:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		name:"String",
		slug:"String",
		description:"String"
	},
	CollectionList:{
		items:"Collection",
		totalItems:"Int"
	},
	NativeAuthStrategyError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	InvalidCredentialsError:{
		errorCode:"ErrorCode",
		message:"String",
		authenticationError:"String"
	},
	OrderStateTransitionError:{
		errorCode:"ErrorCode",
		message:"String",
		transitionError:"String",
		fromState:"String",
		toState:"String"
	},
	EmailAddressConflictError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	GuestCheckoutError:{
		errorCode:"ErrorCode",
		message:"String",
		errorDetail:"String"
	},
	OrderLimitError:{
		errorCode:"ErrorCode",
		message:"String",
		maxItems:"Int"
	},
	NegativeQuantityError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	InsufficientStockError:{
		errorCode:"ErrorCode",
		message:"String",
		quantityAvailable:"Int",
		order:"Order"
	},
	CouponCodeInvalidError:{
		errorCode:"ErrorCode",
		message:"String",
		couponCode:"String"
	},
	CouponCodeExpiredError:{
		errorCode:"ErrorCode",
		message:"String",
		couponCode:"String"
	},
	CouponCodeLimitError:{
		errorCode:"ErrorCode",
		message:"String",
		couponCode:"String",
		limit:"Int"
	},
	OrderModificationError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	IneligibleShippingMethodError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	NoActiveOrderError:{
		errorCode:"ErrorCode",
		message:"String"
	},
	JSON: `scalar.JSON` as const,
	DateTime: `scalar.DateTime` as const,
	Upload: `scalar.Upload` as const,
	Money: `scalar.Money` as const,
	PaginatedList:{
		"...on AdministratorList": "AdministratorList",
		"...on ChannelList": "ChannelList",
		"...on CustomerGroupList": "CustomerGroupList",
		"...on JobList": "JobList",
		"...on PaymentMethodList": "PaymentMethodList",
		"...on SellerList": "SellerList",
		"...on StockLocationList": "StockLocationList",
		"...on TaxCategoryList": "TaxCategoryList",
		"...on ZoneList": "ZoneList",
		"...on AssetList": "AssetList",
		"...on CollectionList": "CollectionList",
		"...on CustomerList": "CustomerList",
		"...on FacetList": "FacetList",
		"...on FacetValueList": "FacetValueList",
		"...on HistoryEntryList": "HistoryEntryList",
		"...on OrderList": "OrderList",
		"...on ProductList": "ProductList",
		"...on ProductVariantList": "ProductVariantList",
		"...on PromotionList": "PromotionList",
		"...on CountryList": "CountryList",
		"...on ProvinceList": "ProvinceList",
		"...on RoleList": "RoleList",
		"...on ShippingMethodList": "ShippingMethodList",
		"...on TagList": "TagList",
		"...on TaxRateList": "TaxRateList",
		items:"Node",
		totalItems:"Int"
	},
	Node:{
		"...on Administrator": "Administrator",
		"...on Collection": "Collection",
		"...on Customer": "Customer",
		"...on Facet": "Facet",
		"...on HistoryEntry": "HistoryEntry",
		"...on Job": "Job",
		"...on Order": "Order",
		"...on Fulfillment": "Fulfillment",
		"...on Payment": "Payment",
		"...on OrderModification": "OrderModification",
		"...on Product": "Product",
		"...on ProductVariant": "ProductVariant",
		"...on StockLevel": "StockLevel",
		"...on StockLocation": "StockLocation",
		"...on StockAdjustment": "StockAdjustment",
		"...on Allocation": "Allocation",
		"...on Sale": "Sale",
		"...on Cancellation": "Cancellation",
		"...on Return": "Return",
		"...on Release": "Release",
		"...on Address": "Address",
		"...on Asset": "Asset",
		"...on Channel": "Channel",
		"...on CustomerGroup": "CustomerGroup",
		"...on FacetValue": "FacetValue",
		"...on OrderLine": "OrderLine",
		"...on Refund": "Refund",
		"...on Surcharge": "Surcharge",
		"...on PaymentMethod": "PaymentMethod",
		"...on ProductOptionGroup": "ProductOptionGroup",
		"...on ProductOption": "ProductOption",
		"...on Promotion": "Promotion",
		"...on Region": "Region",
		"...on Country": "Country",
		"...on Province": "Province",
		"...on Role": "Role",
		"...on Seller": "Seller",
		"...on ShippingMethod": "ShippingMethod",
		"...on Tag": "Tag",
		"...on TaxCategory": "TaxCategory",
		"...on TaxRate": "TaxRate",
		"...on User": "User",
		"...on AuthenticationMethod": "AuthenticationMethod",
		"...on Zone": "Zone",
		id:"ID"
	},
	ErrorResult:{
		"...on MimeTypeError": "MimeTypeError",
		"...on LanguageNotAvailableError": "LanguageNotAvailableError",
		"...on DuplicateEntityError": "DuplicateEntityError",
		"...on FacetInUseError": "FacetInUseError",
		"...on ChannelDefaultLanguageError": "ChannelDefaultLanguageError",
		"...on SettlePaymentError": "SettlePaymentError",
		"...on CancelPaymentError": "CancelPaymentError",
		"...on EmptyOrderLineSelectionError": "EmptyOrderLineSelectionError",
		"...on ItemsAlreadyFulfilledError": "ItemsAlreadyFulfilledError",
		"...on InvalidFulfillmentHandlerError": "InvalidFulfillmentHandlerError",
		"...on CreateFulfillmentError": "CreateFulfillmentError",
		"...on InsufficientStockOnHandError": "InsufficientStockOnHandError",
		"...on MultipleOrderError": "MultipleOrderError",
		"...on CancelActiveOrderError": "CancelActiveOrderError",
		"...on PaymentOrderMismatchError": "PaymentOrderMismatchError",
		"...on RefundOrderStateError": "RefundOrderStateError",
		"...on NothingToRefundError": "NothingToRefundError",
		"...on AlreadyRefundedError": "AlreadyRefundedError",
		"...on QuantityTooGreatError": "QuantityTooGreatError",
		"...on RefundAmountError": "RefundAmountError",
		"...on RefundStateTransitionError": "RefundStateTransitionError",
		"...on PaymentStateTransitionError": "PaymentStateTransitionError",
		"...on FulfillmentStateTransitionError": "FulfillmentStateTransitionError",
		"...on OrderModificationStateError": "OrderModificationStateError",
		"...on NoChangesSpecifiedError": "NoChangesSpecifiedError",
		"...on PaymentMethodMissingError": "PaymentMethodMissingError",
		"...on RefundPaymentIdMissingError": "RefundPaymentIdMissingError",
		"...on ManualPaymentStateError": "ManualPaymentStateError",
		"...on ProductOptionInUseError": "ProductOptionInUseError",
		"...on MissingConditionsError": "MissingConditionsError",
		"...on NativeAuthStrategyError": "NativeAuthStrategyError",
		"...on InvalidCredentialsError": "InvalidCredentialsError",
		"...on OrderStateTransitionError": "OrderStateTransitionError",
		"...on EmailAddressConflictError": "EmailAddressConflictError",
		"...on GuestCheckoutError": "GuestCheckoutError",
		"...on OrderLimitError": "OrderLimitError",
		"...on NegativeQuantityError": "NegativeQuantityError",
		"...on InsufficientStockError": "InsufficientStockError",
		"...on CouponCodeInvalidError": "CouponCodeInvalidError",
		"...on CouponCodeExpiredError": "CouponCodeExpiredError",
		"...on CouponCodeLimitError": "CouponCodeLimitError",
		"...on OrderModificationError": "OrderModificationError",
		"...on IneligibleShippingMethodError": "IneligibleShippingMethodError",
		"...on NoActiveOrderError": "NoActiveOrderError",
		errorCode:"ErrorCode",
		message:"String"
	},
	Adjustment:{
		adjustmentSource:"String",
		type:"AdjustmentType",
		description:"String",
		amount:"Money",
		data:"JSON"
	},
	TaxLine:{
		description:"String",
		taxRate:"Float"
	},
	ConfigArg:{
		name:"String",
		value:"String"
	},
	ConfigArgDefinition:{
		name:"String",
		type:"String",
		list:"Boolean",
		required:"Boolean",
		defaultValue:"JSON",
		label:"String",
		description:"String",
		ui:"JSON"
	},
	ConfigurableOperation:{
		code:"String",
		args:"ConfigArg"
	},
	ConfigurableOperationDefinition:{
		code:"String",
		args:"ConfigArgDefinition",
		description:"String"
	},
	DeletionResponse:{
		result:"DeletionResult",
		message:"String"
	},
	Success:{
		success:"Boolean"
	},
	ShippingMethodQuote:{
		id:"ID",
		price:"Money",
		priceWithTax:"Money",
		code:"String",
		name:"String",
		description:"String",
		metadata:"JSON",
		customFields:"JSON"
	},
	PaymentMethodQuote:{
		id:"ID",
		code:"String",
		name:"String",
		description:"String",
		isEligible:"Boolean",
		eligibilityMessage:"String",
		customFields:"JSON"
	},
	UpdateOrderItemsResult:{
		"...on Order":"Order",
		"...on OrderModificationError":"OrderModificationError",
		"...on OrderLimitError":"OrderLimitError",
		"...on NegativeQuantityError":"NegativeQuantityError",
		"...on InsufficientStockError":"InsufficientStockError"
	},
	RemoveOrderItemsResult:{
		"...on Order":"Order",
		"...on OrderModificationError":"OrderModificationError"
	},
	SetOrderShippingMethodResult:{
		"...on Order":"Order",
		"...on OrderModificationError":"OrderModificationError",
		"...on IneligibleShippingMethodError":"IneligibleShippingMethodError",
		"...on NoActiveOrderError":"NoActiveOrderError"
	},
	ApplyCouponCodeResult:{
		"...on Order":"Order",
		"...on CouponCodeExpiredError":"CouponCodeExpiredError",
		"...on CouponCodeInvalidError":"CouponCodeInvalidError",
		"...on CouponCodeLimitError":"CouponCodeLimitError"
	},
	CustomField:{
		"...on StringCustomFieldConfig": "StringCustomFieldConfig",
		"...on LocaleStringCustomFieldConfig": "LocaleStringCustomFieldConfig",
		"...on IntCustomFieldConfig": "IntCustomFieldConfig",
		"...on FloatCustomFieldConfig": "FloatCustomFieldConfig",
		"...on BooleanCustomFieldConfig": "BooleanCustomFieldConfig",
		"...on DateTimeCustomFieldConfig": "DateTimeCustomFieldConfig",
		"...on RelationCustomFieldConfig": "RelationCustomFieldConfig",
		"...on TextCustomFieldConfig": "TextCustomFieldConfig",
		"...on LocaleTextCustomFieldConfig": "LocaleTextCustomFieldConfig",
		name:"String",
		type:"String",
		list:"Boolean",
		label:"LocalizedString",
		description:"LocalizedString",
		readonly:"Boolean",
		internal:"Boolean",
		nullable:"Boolean",
		requiresPermission:"Permission",
		ui:"JSON"
	},
	StringCustomFieldConfig:{
		name:"String",
		type:"String",
		list:"Boolean",
		length:"Int",
		label:"LocalizedString",
		description:"LocalizedString",
		readonly:"Boolean",
		internal:"Boolean",
		nullable:"Boolean",
		requiresPermission:"Permission",
		pattern:"String",
		options:"StringFieldOption",
		ui:"JSON"
	},
	StringFieldOption:{
		value:"String",
		label:"LocalizedString"
	},
	LocaleStringCustomFieldConfig:{
		name:"String",
		type:"String",
		list:"Boolean",
		length:"Int",
		label:"LocalizedString",
		description:"LocalizedString",
		readonly:"Boolean",
		internal:"Boolean",
		nullable:"Boolean",
		requiresPermission:"Permission",
		pattern:"String",
		ui:"JSON"
	},
	IntCustomFieldConfig:{
		name:"String",
		type:"String",
		list:"Boolean",
		label:"LocalizedString",
		description:"LocalizedString",
		readonly:"Boolean",
		internal:"Boolean",
		nullable:"Boolean",
		requiresPermission:"Permission",
		min:"Int",
		max:"Int",
		step:"Int",
		ui:"JSON"
	},
	FloatCustomFieldConfig:{
		name:"String",
		type:"String",
		list:"Boolean",
		label:"LocalizedString",
		description:"LocalizedString",
		readonly:"Boolean",
		internal:"Boolean",
		nullable:"Boolean",
		requiresPermission:"Permission",
		min:"Float",
		max:"Float",
		step:"Float",
		ui:"JSON"
	},
	BooleanCustomFieldConfig:{
		name:"String",
		type:"String",
		list:"Boolean",
		label:"LocalizedString",
		description:"LocalizedString",
		readonly:"Boolean",
		internal:"Boolean",
		nullable:"Boolean",
		requiresPermission:"Permission",
		ui:"JSON"
	},
	DateTimeCustomFieldConfig:{
		name:"String",
		type:"String",
		list:"Boolean",
		label:"LocalizedString",
		description:"LocalizedString",
		readonly:"Boolean",
		internal:"Boolean",
		nullable:"Boolean",
		requiresPermission:"Permission",
		min:"String",
		max:"String",
		step:"Int",
		ui:"JSON"
	},
	RelationCustomFieldConfig:{
		name:"String",
		type:"String",
		list:"Boolean",
		label:"LocalizedString",
		description:"LocalizedString",
		readonly:"Boolean",
		internal:"Boolean",
		nullable:"Boolean",
		requiresPermission:"Permission",
		entity:"String",
		scalarFields:"String",
		ui:"JSON"
	},
	TextCustomFieldConfig:{
		name:"String",
		type:"String",
		list:"Boolean",
		label:"LocalizedString",
		description:"LocalizedString",
		readonly:"Boolean",
		internal:"Boolean",
		nullable:"Boolean",
		requiresPermission:"Permission",
		ui:"JSON"
	},
	LocaleTextCustomFieldConfig:{
		name:"String",
		type:"String",
		list:"Boolean",
		label:"LocalizedString",
		description:"LocalizedString",
		readonly:"Boolean",
		internal:"Boolean",
		nullable:"Boolean",
		requiresPermission:"Permission",
		ui:"JSON"
	},
	LocalizedString:{
		languageCode:"LanguageCode",
		value:"String"
	},
	CustomFieldConfig:{
		"...on StringCustomFieldConfig":"StringCustomFieldConfig",
		"...on LocaleStringCustomFieldConfig":"LocaleStringCustomFieldConfig",
		"...on IntCustomFieldConfig":"IntCustomFieldConfig",
		"...on FloatCustomFieldConfig":"FloatCustomFieldConfig",
		"...on BooleanCustomFieldConfig":"BooleanCustomFieldConfig",
		"...on DateTimeCustomFieldConfig":"DateTimeCustomFieldConfig",
		"...on RelationCustomFieldConfig":"RelationCustomFieldConfig",
		"...on TextCustomFieldConfig":"TextCustomFieldConfig",
		"...on LocaleTextCustomFieldConfig":"LocaleTextCustomFieldConfig"
	},
	CustomerGroup:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		name:"String",
		customers:"CustomerList",
		customFields:"JSON"
	},
	CustomerList:{
		items:"Customer",
		totalItems:"Int"
	},
	FacetValue:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		facet:"Facet",
		facetId:"ID",
		name:"String",
		code:"String",
		translations:"FacetValueTranslation",
		customFields:"JSON"
	},
	FacetValueTranslation:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		name:"String"
	},
	FacetTranslation:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		name:"String"
	},
	FacetList:{
		items:"Facet",
		totalItems:"Int"
	},
	FacetValueList:{
		items:"FacetValue",
		totalItems:"Int"
	},
	HistoryEntryList:{
		items:"HistoryEntry",
		totalItems:"Int"
	},
	OrderTaxSummary:{
		description:"String",
		taxRate:"Float",
		taxBase:"Money",
		taxTotal:"Money"
	},
	OrderAddress:{
		fullName:"String",
		company:"String",
		streetLine1:"String",
		streetLine2:"String",
		city:"String",
		province:"String",
		postalCode:"String",
		country:"String",
		countryCode:"String",
		phoneNumber:"String",
		customFields:"JSON"
	},
	OrderList:{
		items:"Order",
		totalItems:"Int"
	},
	ShippingLine:{
		id:"ID",
		shippingMethod:"ShippingMethod",
		price:"Money",
		priceWithTax:"Money",
		discountedPrice:"Money",
		discountedPriceWithTax:"Money",
		discounts:"Discount"
	},
	Discount:{
		adjustmentSource:"String",
		type:"AdjustmentType",
		description:"String",
		amount:"Money",
		amountWithTax:"Money"
	},
	OrderLine:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		productVariant:"ProductVariant",
		featuredAsset:"Asset",
		unitPrice:"Money",
		unitPriceWithTax:"Money",
		unitPriceChangeSinceAdded:"Money",
		unitPriceWithTaxChangeSinceAdded:"Money",
		discountedUnitPrice:"Money",
		discountedUnitPriceWithTax:"Money",
		proratedUnitPrice:"Money",
		proratedUnitPriceWithTax:"Money",
		quantity:"Int",
		orderPlacedQuantity:"Int",
		taxRate:"Float",
		linePrice:"Money",
		linePriceWithTax:"Money",
		discountedLinePrice:"Money",
		discountedLinePriceWithTax:"Money",
		proratedLinePrice:"Money",
		proratedLinePriceWithTax:"Money",
		lineTax:"Money",
		discounts:"Discount",
		taxLines:"TaxLine",
		order:"Order",
		fulfillmentLines:"FulfillmentLine",
		customFields:"OrderLineCustomFields"
	},
	RefundLine:{
		orderLine:"OrderLine",
		orderLineId:"ID",
		quantity:"Int",
		refund:"Refund",
		refundId:"ID"
	},
	Refund:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		items:"Money",
		shipping:"Money",
		adjustment:"Money",
		total:"Money",
		method:"String",
		state:"String",
		transactionId:"String",
		reason:"String",
		lines:"RefundLine",
		paymentId:"ID",
		metadata:"JSON"
	},
	FulfillmentLine:{
		orderLine:"OrderLine",
		orderLineId:"ID",
		quantity:"Int",
		fulfillment:"Fulfillment",
		fulfillmentId:"ID"
	},
	Surcharge:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		description:"String",
		sku:"String",
		taxLines:"TaxLine",
		price:"Money",
		priceWithTax:"Money",
		taxRate:"Float"
	},
	PaymentMethod:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		name:"String",
		code:"String",
		description:"String",
		enabled:"Boolean",
		checker:"ConfigurableOperation",
		handler:"ConfigurableOperation",
		translations:"PaymentMethodTranslation",
		customFields:"JSON"
	},
	PaymentMethodTranslation:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		name:"String",
		description:"String"
	},
	ProductOptionGroup:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		code:"String",
		name:"String",
		options:"ProductOption",
		translations:"ProductOptionGroupTranslation",
		customFields:"JSON"
	},
	ProductOptionGroupTranslation:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		name:"String"
	},
	ProductOption:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		code:"String",
		name:"String",
		groupId:"ID",
		group:"ProductOptionGroup",
		translations:"ProductOptionTranslation",
		customFields:"JSON"
	},
	ProductOptionTranslation:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		name:"String"
	},
	SearchReindexResponse:{
		success:"Boolean"
	},
	SearchResponse:{
		items:"SearchResult",
		totalItems:"Int",
		facetValues:"FacetValueResult",
		collections:"CollectionResult"
	},
	FacetValueResult:{
		facetValue:"FacetValue",
		count:"Int"
	},
	CollectionResult:{
		collection:"Collection",
		count:"Int"
	},
	SearchResultAsset:{
		id:"ID",
		preview:"String",
		focalPoint:"Coordinate"
	},
	SearchResultPrice:{
		"...on PriceRange":"PriceRange",
		"...on SinglePrice":"SinglePrice"
	},
	SinglePrice:{
		value:"Money"
	},
	PriceRange:{
		min:"Money",
		max:"Money"
	},
	ProductTranslation:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		name:"String",
		slug:"String",
		description:"String"
	},
	ProductList:{
		items:"Product",
		totalItems:"Int"
	},
	ProductVariantList:{
		items:"ProductVariant",
		totalItems:"Int"
	},
	ProductVariantTranslation:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		name:"String"
	},
	Promotion:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		startsAt:"DateTime",
		endsAt:"DateTime",
		couponCode:"String",
		perCustomerUsageLimit:"Int",
		usageLimit:"Int",
		name:"String",
		description:"String",
		enabled:"Boolean",
		conditions:"ConfigurableOperation",
		actions:"ConfigurableOperation",
		translations:"PromotionTranslation",
		customFields:"JSON"
	},
	PromotionTranslation:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		name:"String",
		description:"String"
	},
	PromotionList:{
		items:"Promotion",
		totalItems:"Int"
	},
	Region:{
		"...on Country": "Country",
		"...on Province": "Province",
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		code:"String",
		type:"String",
		name:"String",
		enabled:"Boolean",
		parent:"Region",
		parentId:"ID",
		translations:"RegionTranslation"
	},
	RegionTranslation:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		name:"String"
	},
	Country:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		code:"String",
		type:"String",
		name:"String",
		enabled:"Boolean",
		parent:"Region",
		parentId:"ID",
		translations:"RegionTranslation",
		customFields:"JSON"
	},
	CountryList:{
		items:"Country",
		totalItems:"Int"
	},
	Province:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		code:"String",
		type:"String",
		name:"String",
		enabled:"Boolean",
		parent:"Region",
		parentId:"ID",
		translations:"RegionTranslation",
		customFields:"JSON"
	},
	ProvinceList:{
		items:"Province",
		totalItems:"Int"
	},
	Role:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		code:"String",
		description:"String",
		permissions:"Permission",
		channels:"Channel"
	},
	RoleList:{
		items:"Role",
		totalItems:"Int"
	},
	Seller:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		name:"String",
		customFields:"JSON"
	},
	ShippingMethod:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		code:"String",
		name:"String",
		description:"String",
		fulfillmentHandlerCode:"String",
		checker:"ConfigurableOperation",
		calculator:"ConfigurableOperation",
		translations:"ShippingMethodTranslation",
		customFields:"JSON"
	},
	ShippingMethodTranslation:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		languageCode:"LanguageCode",
		name:"String",
		description:"String"
	},
	ShippingMethodList:{
		items:"ShippingMethod",
		totalItems:"Int"
	},
	Tag:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		value:"String"
	},
	TagList:{
		items:"Tag",
		totalItems:"Int"
	},
	TaxCategory:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		name:"String",
		isDefault:"Boolean",
		customFields:"JSON"
	},
	TaxRate:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		name:"String",
		enabled:"Boolean",
		value:"Float",
		category:"TaxCategory",
		zone:"Zone",
		customerGroup:"CustomerGroup",
		customFields:"JSON"
	},
	TaxRateList:{
		items:"TaxRate",
		totalItems:"Int"
	},
	User:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		identifier:"String",
		verified:"Boolean",
		roles:"Role",
		lastLogin:"DateTime",
		authenticationMethods:"AuthenticationMethod",
		customFields:"JSON"
	},
	AuthenticationMethod:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		strategy:"String"
	},
	Zone:{
		id:"ID",
		createdAt:"DateTime",
		updatedAt:"DateTime",
		name:"String",
		members:"Region",
		customFields:"JSON"
	},
	MetricSummary:{
		interval:"MetricInterval",
		type:"MetricType",
		title:"String",
		entries:"MetricSummaryEntry"
	},
	MetricSummaryEntry:{
		label:"String",
		value:"Float"
	},
	OrderLineCustomFields:{
		booleanExample:"Boolean",
		booleanExampleCustom:"Boolean",
		datetimeExample:"DateTime",
		floatExample:"Float",
		intExample:"Int",
		stringExample:"String",
		textExample:"String",
		relationExample:"Asset",
		productRelationExample:"Product",
		productVariantRelationExample:"ProductVariant",
		booleanExampleList:"Boolean",
		datetimeExampleList:"DateTime",
		floatExampleList:"Float",
		intExampleList:"Int",
		stringExampleList:"String",
		textExampleList:"String",
		relationExampleList:"Asset"
	},
	CustomFields:{
		Address:"CustomFieldConfig",
		Administrator:"CustomFieldConfig",
		Asset:"CustomFieldConfig",
		Channel:"CustomFieldConfig",
		Collection:"CustomFieldConfig",
		Customer:"CustomFieldConfig",
		CustomerGroup:"CustomFieldConfig",
		Facet:"CustomFieldConfig",
		FacetValue:"CustomFieldConfig",
		Fulfillment:"CustomFieldConfig",
		GlobalSettings:"CustomFieldConfig",
		Order:"CustomFieldConfig",
		OrderLine:"CustomFieldConfig",
		PaymentMethod:"CustomFieldConfig",
		Product:"CustomFieldConfig",
		ProductOption:"CustomFieldConfig",
		ProductOptionGroup:"CustomFieldConfig",
		ProductVariant:"CustomFieldConfig",
		ProductVariantPrice:"CustomFieldConfig",
		Promotion:"CustomFieldConfig",
		Region:"CustomFieldConfig",
		Seller:"CustomFieldConfig",
		ShippingMethod:"CustomFieldConfig",
		StockLocation:"CustomFieldConfig",
		TaxCategory:"CustomFieldConfig",
		TaxRate:"CustomFieldConfig",
		User:"CustomFieldConfig",
		Zone:"CustomFieldConfig"
	},
	EntityCustomFields:{
		entityName:"String",
		customFields:"CustomFieldConfig"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}