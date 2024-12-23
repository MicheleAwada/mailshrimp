from rest_framework import serializers
from . import models
import math
import re
from pathlib import Path
import os
import subprocess
from django.conf import settings


DEFAULT_DKIM_SELECTOR = settings.DEFAULT_DKIM_SELECTOR
DEFAULT_DKIM_PATH = settings.DEFAULT_DKIM_PATH
SHOW_PRIVATE_DKIM = settings.SHOW_PRIVATE_DKIM

full_dkim_read_only_fields = ["dkim", "dkim_public", "dkim_dns_zone_file", ]
if SHOW_PRIVATE_DKIM:
    full_dkim_read_only_fields.append("dkim_private")
full_dkim_fields = ["dkim_selector", "dkim_key_size"] + full_dkim_read_only_fields



class IntegerOrInfinityField(serializers.IntegerField):
    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        if value == -1:
            return math.inf
        if value < 0:
            raise serializers.ValidationError("Number Must Be Positive")
        return value
    def to_representation(self, value):
        if value == math.inf:
            return -1
        return super().to_representation(value)


def fully_create_directory(directory_path):
    directory_path = str(Path(directory_path))
    directory_parent = Path(directory_path).parent
    if not os.path.exists(directory_parent):
        fully_create_directory(directory_parent)
    if not os.path.exists(directory_path):
        os.mkdir(directory_path)
    return directory_path

def valid_domain_name(name):
    domain_regrex = r'^[a-zA-Z0-9.-]+$'
    return re.match(domain_regrex, name) is not None


def generate_dkim_keypair(domain_name, dkim_selector, key_dir, key_size):
    private_key_path = os.path.join(key_dir, f'{dkim_selector}.private')
    public_key_path = os.path.join(key_dir, f'{dkim_selector}.public')

    # Generate DKIM key pair using openssl
    subprocess.run(['openssl', 'genrsa', '-out', private_key_path, key_size], check=True)
    subprocess.run(['openssl', 'rsa', '-in', private_key_path, '-outform', 'PEM', '-pubout', '-out', public_key_path], check=True)

    # Read the public key from file
    with open(public_key_path, 'r') as f:
        public_key = f.read().strip()
        public_key_splitted_list = public_key.split("\n")
        public_key_splitted_list = public_key_splitted_list[1:-1]
        public_key = "".join(public_key_splitted_list)
    with open(private_key_path, 'r') as f:
        private_key = f.read().strip()
        formatted_private_splitted_list = private_key.split("\n")
        formatted_private_splitted_list = formatted_private_splitted_list[1:-1]
        formatted_private = "".join(formatted_private_splitted_list)
    dkim_record = f"v=DKIM1;k=rsa;t=s;s=email;p={public_key}"
    public_dkim_file_format = f'{dkim_selector}._domainkey.{domain_name} IN TXT "{dkim_record}"'
    with open(public_key_path, 'w') as f:
        f.write(public_dkim_file_format)
    return { "dkim_dns_zone_file": public_dkim_file_format, "dkim": dkim_record, "dkim_public": public_key, "dkim_private": private_key, }
def get_and_create_default_dkim_key_path(domain_name):
    return fully_create_directory(os.path.join(DEFAULT_DKIM_PATH, domain_name))
def set_dkim(domain_name, dkim_selector, dkim_key_size):
    key_dir = get_and_create_default_dkim_key_path(domain_name)
    keys = generate_dkim_keypair(domain_name=domain_name, dkim_selector=dkim_selector, key_dir=key_dir,
                                                         key_size=str(dkim_key_size))
    return keys




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