class DomainSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        quota = attrs.get("quota")
        max_mailbox_quota = attrs.get("max_mailbox_quota")
        if max_mailbox_quota > quota:
            raise serializers.ValidationError("Domain's Max MailBox Quota must not be greater than Domain Quota")

        instance = self.instance
        domain_name = attrs.get("name")
        dkim_selector = attrs.get("dkim_selector")
        dkim_key_size = attrs.get("dkim_key_size")
        created = instance is None
        dkim_options_changed =  not created and (dkim_selector != instance.dkim_selector or dkim_key_size != instance.dkim_key_size)
        need_to_change_dkim = bool(created or dkim_options_changed)
        if need_to_change_dkim:
            dkim_dictonary_value = set_dkim(dkim_selector=dkim_selector, dkim_key_size=dkim_key_size, domain_name=domain_name)
            for key, value in dkim_dictonary_value.items():
                attrs[key] = value
        return attrs


    quota = IntegerOrInfinityField()
    max_mailbox_quota = IntegerOrInfinityField()
    max_mailboxes = IntegerOrInfinityField()
    max_aliases = IntegerOrInfinityField()
    class Meta:
        model = models.Domain
        fields = [*full_dkim_fields, "name", "quota", "max_mailbox_quota", "max_mailboxes", "max_aliases"]
        read_only_fields = [*full_dkim_read_only_fields]




class DomainForeignKeyField(serializers.RelatedField):
    def to_representation(self, value):
        return value.id

    def to_internal_value(self, data):
        try:
            obj = models.Domain.objects.get(name=data)
            return obj
        except models.Domain.DoesNotExist:
            raise serializers.ValidationError("Related object does not exist.")

class MailBoxSerializer(serializers.ModelSerializer):
    domain = DomainForeignKeyField(queryset=models.Domain.objects.all())
    def validate(self, attrs):
        quota = attrs.get("quota")
        max_mailbox_quota = models.MailBox(domain=attrs.get("domain"), quota=attrs.get("quota"), ).get_max_mailbox_quota(exclude=False) # exclude=False since its not saved
        if quota > max_mailbox_quota:
            raise serializers.ValidationError("MailBox Quota must not be greater than Domain's Max MailBox Quota")
        return attrs
    def validate_password(self, value):
        fake_model = models.MailBox(password=value)
        fake_model.set_password(value)
        return fake_model.password

    class Meta:
        model = models.MailBox
        fields = ["fullname", "username", "quota", "password", "domain"]
        extra_kwargs = {
            "password": {"write_only": True},
        }