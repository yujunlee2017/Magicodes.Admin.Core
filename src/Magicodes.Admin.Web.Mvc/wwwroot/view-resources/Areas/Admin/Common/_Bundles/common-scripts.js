(function ($) {
    $.validator.setDefaults({
        errorElement: 'span',
        errorClass: 'help-block help-block-validation-error',
        focusInvalid: false,
        submitOnKeyPress: true,

        highlight: function (element) {
            $(element).closest('.form-group').addClass('has-error');
        },

        unhighlight: function (element) {
            $(element).closest('.form-group').removeClass('has-error');
        },

        errorPlacement: function (error, element) {
            if (element.closest('.input-icon').size() === 1) {
                error.insertAfter(element.closest('.input-icon'));
            } else {
                error.insertAfter(element);
            }
        },

        success: function (label) {
            label.closest('.form-group').removeClass('has-error');
            label.remove();
        },

        submitHandler: function (form) {
            $(form).find('.alert-danger').hide();
        }
    });
})(jQuery);
(function () {
    app.modals.LookupModal = function () {

        var _modalManager;

        var _options = {
            serviceMethod: null, //Required
            title: app.localize('SelectAnItem'),
            loadOnStartup: true,
            showFilter: true,
            filterText: '',
            pageSize: app.consts.grid.defaultPageSize,
            canSelect: function (item) {
                /* This method can return boolean or a promise which returns boolean.
                 * A false value is used to prevent selection.
                 */
                return true;
            }
        };

        var _$table;
        var _$filterInput;

        function refreshTable() {
            var prms = $.extend({
                filter: _$filterInput.val()
            }, _modalManager.getArgs().extraFilters);

            _$table.jtable('load', prms);
        };

        function selectItem(item) {
            var boolOrPromise = _options.canSelect(item);
            if (!boolOrPromise) {
                return;
            }

            if (boolOrPromise === true) {
                _modalManager.setResult(item);
                _modalManager.close();
                return;
            }

            //assume as promise
            boolOrPromise.then(function (result) {
                if (result) {
                    _modalManager.setResult(item);
                    _modalManager.close();
                }
            });
        }

        this.init = function (modalManager) {
            _modalManager = modalManager;
            _options = $.extend(_options, _modalManager.getOptions().lookupOptions);

            _$table = _modalManager.getModal().find('.lookup-modal-table');
            _$table.jtable({
                title: _options.title,
                paging: true,
                pageSize: _options.pageSize,

                actions: {
                    listAction: {
                        method: _options.serviceMethod
                    }
                },

                fields: {
                    select: {
                        title: app.localize('Select'),
                        width: '10%',
                        display: function (data) {
                            var $span = $('<span></span>');
                            $('<button class="btn btn-default btn-xs" title="' + app.localize('Select') + '"><i class="fa fa-check"></i></button>')
                                .appendTo($span)
                                .click(function () {
                                    selectItem(data.record);
                                });
                            return $span;
                        }
                    },
                    name: {
                        title: app.localize('Name'),
                        width: '90%'
                    }
                }
            });

            _modalManager.getModal()
                .find('.lookup-filter-button')
                .click(function (e) {
                    e.preventDefault();
                    refreshTable();
                });

            _modalManager.getModal()
                .find('.modal-body')
                .keydown(function (e) {
                    if (e.which == 13) {
                        e.preventDefault();
                        refreshTable();
                    }
                });

            _$filterInput = _modalManager.getModal().find('.lookup-filter-text');
            _$filterInput.val(_options.filterText);

            if (_options.loadOnStartup) {
                refreshTable();
            }
        };
    };

    app.modals.LookupModal.create = function (lookupOptions) {
        return new app.ModalManager({
            viewUrl: abp.appPath + 'Admin/Common/LookupModal',
            scriptUrl: abp.appPath + 'view-resources/Areas/Admin/Views/Common/Modals/_LookupModal.js',
            modalClass: 'LookupModal',
            lookupOptions: lookupOptions
        });
    };
})();